import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';
import type { AppEnv } from '../src/config/env.js';
import { AuthService } from '../src/services/auth.service.js';
import { OrgService } from '../src/services/org.service.js';
import { InMemoryAuthRepository } from './utils/inmemory.repository.js';
import { TestEmailService } from './utils/testEmailService.js';

function testEnv(): AppEnv {
  return {
    nodeEnv: 'test',
    port: 0,
    appBaseUrl: 'http://localhost:3000',
    jwtAccessSecret: 'test_access',
    jwtRefreshSecret: 'test_refresh',
    accessTokenTtlSeconds: 60,
    refreshTokenTtlDays: 1,
    cookieSecure: false,
    cookieNameRefreshToken: 'refresh_token',
    exposeEmailTokensInResponse: true
  };
}

describe('auth routes', () => {
  let repo: InMemoryAuthRepository;
  let email: TestEmailService;
  let env: AppEnv;

  beforeEach(async () => {
    repo = new InMemoryAuthRepository();
    email = new TestEmailService();
    env = testEnv();
    await repo.ensureDefaultRoles();
  });

  it('signup -> verify-email -> refresh -> logout', async () => {
    const authService = new AuthService({ env, repo, email });
    const orgService = new OrgService({ env, repo, email });
    const app = createApp({ env, repo, email, authService, orgService });

    const agent = request.agent(app);

    const signup = await agent.post('/auth/signup').send({ email: 'a@example.com', password: 'Password123!' });
    expect(signup.status).toBe(201);
    expect(typeof signup.body.accessToken).toBe('string');
    expect(typeof signup.body.emailVerificationToken).toBe('string');

    const verify = await agent.post('/auth/verify-email').send({ token: signup.body.emailVerificationToken });
    expect(verify.status).toBe(204);

    const refresh = await agent.post('/auth/refresh');
    expect(refresh.status).toBe(200);
    expect(typeof refresh.body.accessToken).toBe('string');

    const logout = await agent.post('/auth/logout');
    expect(logout.status).toBe(204);

    const refreshAfterLogout = await agent.post('/auth/refresh');
    expect(refreshAfterLogout.status).toBe(400);
  });

  it('password reset rotates credentials', async () => {
    const authService = new AuthService({ env, repo, email });
    const orgService = new OrgService({ env, repo, email });
    const app = createApp({ env, repo, email, authService, orgService });

    const agent = request.agent(app);

    await agent.post('/auth/signup').send({ email: 'b@example.com', password: 'Password123!' });

    const reqReset = await agent.post('/auth/request-password-reset').send({ email: 'b@example.com' });
    expect(reqReset.status).toBe(200);
    expect(typeof reqReset.body.passwordResetToken).toBe('string');

    const reset = await agent
      .post('/auth/reset-password')
      .send({ token: reqReset.body.passwordResetToken, newPassword: 'NewPassword123!' });
    expect(reset.status).toBe(204);

    const badLogin = await agent.post('/auth/login').send({ email: 'b@example.com', password: 'Password123!' });
    expect(badLogin.status).toBe(401);

    const login = await agent.post('/auth/login').send({ email: 'b@example.com', password: 'NewPassword123!' });
    expect(login.status).toBe(200);
    expect(typeof login.body.accessToken).toBe('string');
  });

  it('organization creation and invitation acceptance', async () => {
    const authService = new AuthService({ env, repo, email });
    const orgService = new OrgService({ env, repo, email });
    const app = createApp({ env, repo, email, authService, orgService });

    const agent = request.agent(app);

    const signup = await agent.post('/auth/signup').send({ email: 'owner@example.com', password: 'Password123!' });
    expect(signup.status).toBe(201);

    const accessToken = signup.body.accessToken as string;

    const createOrg = await agent
      .post('/orgs')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name: 'Acme' });
    expect(createOrg.status).toBe(201);

    const orgId = createOrg.body.organization.id as string;

    const createTeam = await agent
      .post(`/orgs/${orgId}/teams`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name: 'Engineering' });
    expect(createTeam.status).toBe(201);

    const teamId = createTeam.body.team.id as string;

    const invite = await agent
      .post(`/orgs/${orgId}/invitations`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ email: 'member@example.com', roleName: 'TEAM_MEMBER', teamId });

    expect(invite.status).toBe(201);
    expect(typeof invite.body.invitationToken).toBe('string');

    const accept = await agent.post('/invitations/accept').send({
      token: invite.body.invitationToken,
      password: 'Password123!'
    });

    expect(accept.status).toBe(200);
    expect(accept.body.organizationId).toBe(orgId);
    expect(accept.body.teamId).toBe(teamId);
  });
});

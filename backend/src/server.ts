import { PrismaClient } from '@prisma/client';
import { createApp } from './app.js';
import { getEnv } from './config/env.js';
import { PrismaAuthRepository } from './repositories/prisma.repository.js';
import { AuthService } from './services/auth.service.js';
import { ConsoleEmailService } from './services/email.service.js';
import { OrgService } from './services/org.service.js';

async function main() {
  const env = getEnv();

  const prisma = new PrismaClient();
  const repo = new PrismaAuthRepository(prisma);
  const email = new ConsoleEmailService();

  await repo.ensureDefaultRoles();

  const authService = new AuthService({ env, repo, email });
  const orgService = new OrgService({ env, repo, email });

  const app = createApp({ env, repo, email, authService, orgService });

  const server = app.listen(env.port, () => {
    console.log(`backend listening on :${env.port}`);
  });

  const shutdown = async () => {
    server.close();
    await prisma.$disconnect();
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

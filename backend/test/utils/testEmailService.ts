import type { EmailService } from '../../src/types/email.js';

export class TestEmailService implements EmailService {
  public readonly sent: Array<{ kind: 'verify' | 'reset' | 'invite'; to: string; url: string }> = [];

  async sendEmailVerification(params: { to: string; verifyUrl: string }): Promise<void> {
    this.sent.push({ kind: 'verify', to: params.to, url: params.verifyUrl });
  }

  async sendPasswordReset(params: { to: string; resetUrl: string }): Promise<void> {
    this.sent.push({ kind: 'reset', to: params.to, url: params.resetUrl });
  }

  async sendInvitation(params: { to: string; inviteUrl: string }): Promise<void> {
    this.sent.push({ kind: 'invite', to: params.to, url: params.inviteUrl });
  }
}

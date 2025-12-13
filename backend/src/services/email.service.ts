import type { EmailService } from '../types/email.js';

export class ConsoleEmailService implements EmailService {
  async sendEmailVerification(params: { to: string; verifyUrl: string }): Promise<void> {
    console.log(`[email] verify-email to=${params.to} url=${params.verifyUrl}`);
  }

  async sendPasswordReset(params: { to: string; resetUrl: string }): Promise<void> {
    console.log(`[email] password-reset to=${params.to} url=${params.resetUrl}`);
  }

  async sendInvitation(params: { to: string; inviteUrl: string }): Promise<void> {
    console.log(`[email] invitation to=${params.to} url=${params.inviteUrl}`);
  }
}

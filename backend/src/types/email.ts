export interface EmailService {
  sendEmailVerification(params: { to: string; verifyUrl: string }): Promise<void>;
  sendPasswordReset(params: { to: string; resetUrl: string }): Promise<void>;
  sendInvitation(params: { to: string; inviteUrl: string }): Promise<void>;
}

import { OAuth2Client } from 'google-auth-library';
import { config } from '../config/env';

const oauth2Client = new OAuth2Client(config.google.clientId);

export interface GoogleUserInfo {
  email: string;
  name: string;
  picture?: string;
  sub: string; // Google ID
  email_verified: boolean;
}

export const verifyGoogleToken = async (idToken: string): Promise<GoogleUserInfo> => {
  try {
    const ticket = await oauth2Client.verifyIdToken({
      idToken,
      audience: config.google.clientId,
    });

    const payload = ticket.getPayload();
    
    if (!payload || !payload.email) {
      throw new Error('Invalid Google token payload');
    }

    return {
      email: payload.email,
      name: payload.name || '',
      picture: payload.picture,
      sub: payload.sub,
      email_verified: payload.email_verified || false,
    };
  } catch (error) {
    throw new Error('Failed to verify Google token');
  }
};

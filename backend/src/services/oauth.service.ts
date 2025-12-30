import { OAuth2Client } from 'google-auth-library';
import prisma from '../config/database';

const googleClient = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

export interface GoogleUserInfo {
  id: string;
  email: string;
  name: string;
  picture?: string;
}

export async function verifyGoogleToken(token: string): Promise<GoogleUserInfo> {
  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload || !payload.email) {
      throw new Error('Invalid Google token');
    }

    return {
      id: payload.sub,
      email: payload.email,
      name: payload.name || 'User',
      picture: payload.picture,
    };
  } catch (error) {
    throw new Error('Failed to verify Google token');
  }
}

export async function findOrCreateGoogleUser(googleInfo: GoogleUserInfo) {
  let user = await prisma.user.findUnique({
    where: { googleId: googleInfo.id },
  });

  if (!user) {
    // Check if user exists with same email
    const existingUser = await prisma.user.findUnique({
      where: { email: googleInfo.email },
    });

    if (existingUser) {
      // Link Google account to existing user
      user = await prisma.user.update({
        where: { id: existingUser.id },
        data: {
          googleId: googleInfo.id,
          avatar: googleInfo.picture,
        },
      });
    } else {
      // Create new user
      user = await prisma.user.create({
        data: {
          email: googleInfo.email,
          name: googleInfo.name,
          googleId: googleInfo.id,
          avatar: googleInfo.picture,
          isVerified: true,
          emailVerified: new Date(),
        },
      });
    }
  }

  return user;
}

import { Router } from 'express';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { findOrCreateGoogleUser } from '../services/oauth.service';
import { generateAccessToken, generateRefreshToken, TokenPayload } from '../config/jwt';
import prisma from '../config/database';
import { addDays } from 'date-fns';

const router = Router();

const REFRESH_TOKEN_EXPIRY_DAYS = 7;

// Configure Google Strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      callbackURL: process.env.GOOGLE_REDIRECT_URI || '/auth/google/callback',
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const googleInfo = {
          id: profile.id,
          email: profile.emails?.[0]?.value || '',
          name: profile.displayName || 'User',
          picture: profile.photos?.[0]?.value,
        };

        const user = await findOrCreateGoogleUser(googleInfo);
        return done(null, user);
      } catch (error) {
        return done(error, undefined);
      }
    }
  )
);

// Serialize user for session
passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

// Deserialize user from session
passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await prisma.user.findUnique({ where: { id } });
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

// Google OAuth routes (server-side flow)
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get(
  '/google/callback',
  passport.authenticate('google', { failureRedirect: `${process.env.FRONTEND_URL}/auth/login?error=oauth_failed` }),
  async (req: any, res) => {
    try {
      const user = req.user;
      
      // Generate tokens
      const tokenPayload: TokenPayload = { userId: user.id, email: user.email };
      const accessToken = generateAccessToken(tokenPayload);
      const refreshToken = generateRefreshToken(tokenPayload);

      // Store refresh token
      const refreshTokenExpiry = addDays(new Date(), REFRESH_TOKEN_EXPIRY_DAYS);
      await prisma.refreshToken.create({
        data: {
          token: refreshToken,
          userId: user.id,
          expiresAt: refreshTokenExpiry,
        },
      });

      // Set refresh token in httpOnly cookie
      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000,
      });

      // Redirect to frontend with access token
      res.redirect(`${process.env.FRONTEND_URL}/auth/callback?token=${accessToken}`);
    } catch (error) {
      res.redirect(`${process.env.FRONTEND_URL}/auth/login?error=server_error`);
    }
  }
);

export default router;

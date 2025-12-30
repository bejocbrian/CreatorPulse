import { User } from '@prisma/client';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
      };
    }
    
    interface User {
      id: string;
      email: string;
      password?: string;
      name: string;
      creatorType?: string;
      currency: string;
      payoutRegion?: string;
      isVerified: boolean;
      avatar?: string;
      googleId?: string;
      emailVerified?: Date;
      createdAt: Date;
      updatedAt: Date;
    }
  }
}

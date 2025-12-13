import type { AppContext } from './context.js';
import type { AuthenticatedUser } from './auth.js';

declare global {
  namespace Express {
    interface Request {
      ctx: AppContext;
      auth?: AuthenticatedUser;
    }
  }
}

export {};

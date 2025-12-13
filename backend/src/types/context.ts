import type { AuthRepository } from './repositories.js';
import type { EmailService } from './email.js';
import type { AuthService } from '../services/auth.service.js';
import type { OrgService } from '../services/org.service.js';
import type { AppEnv } from '../config/env.js';

export type AppContext = {
  env: AppEnv;
  repo: AuthRepository;
  email: EmailService;
  authService: AuthService;
  orgService: OrgService;
};

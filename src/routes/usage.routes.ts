import { Router, Response } from 'express';
import { authenticate, requireOrganization, AuthRequest } from '../middleware/auth';
import { usageService } from '../services/usage.service';
import { logger } from '../utils/logger';

const router = Router();

router.get(
  '/current',
  authenticate,
  requireOrganization,
  async (req: AuthRequest, res: Response) => {
    try {
      const usage = await usageService.getOrganizationUsage(req.user!.organizationId!);
      res.json(usage);
    } catch (error) {
      logger.error('Failed to get usage', { error });
      res.status(500).json({ error: 'Failed to get usage metrics' });
    }
  }
);

router.get(
  '/limits',
  authenticate,
  requireOrganization,
  async (req: AuthRequest, res: Response) => {
    try {
      const limits = await usageService.checkLimits(req.user!.organizationId!);
      res.json(limits);
    } catch (error) {
      logger.error('Failed to check limits', { error });
      res.status(500).json({ error: 'Failed to check limits' });
    }
  }
);

router.get(
  '/history',
  authenticate,
  requireOrganization,
  async (req: AuthRequest, res: Response) => {
    try {
      const days = req.query.days ? parseInt(req.query.days as string, 10) : 30;
      const history = await usageService.getUsageHistory(req.user!.organizationId!, days);
      res.json(history);
    } catch (error) {
      logger.error('Failed to get usage history', { error });
      res.status(500).json({ error: 'Failed to get usage history' });
    }
  }
);

router.post(
  '/record',
  authenticate,
  requireOrganization,
  async (req: AuthRequest, res: Response) => {
    try {
      const metrics = await usageService.recordUsageMetrics(req.user!.organizationId!);
      res.json(metrics);
    } catch (error) {
      logger.error('Failed to record usage', { error });
      res.status(500).json({ error: 'Failed to record usage metrics' });
    }
  }
);

export default router;

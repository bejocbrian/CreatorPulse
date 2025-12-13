import { Router, Request, Response } from 'express';
import { authenticate, requireOrganization, AuthRequest } from '../middleware/auth';
import { stripeService } from '../services/stripe.service';
import { logger } from '../utils/logger';
import { config } from '../config';

const router = Router();

router.post(
  '/create-checkout-session',
  authenticate,
  requireOrganization,
  async (req: AuthRequest, res: Response) => {
    try {
      const { priceId } = req.body;

      if (!priceId) {
        return res.status(400).json({ error: 'Price ID is required' });
      }

      const successUrl = `${config.frontend.url}/subscription/success?session_id={CHECKOUT_SESSION_ID}`;
      const cancelUrl = `${config.frontend.url}/subscription/cancel`;

      const session = await stripeService.createCheckoutSession(
        req.user!.organizationId!,
        priceId,
        successUrl,
        cancelUrl
      );

      res.json({ sessionId: session.id, url: session.url });
    } catch (error) {
      logger.error('Failed to create checkout session', { error });
      res.status(500).json({ error: 'Failed to create checkout session' });
    }
  }
);

router.post(
  '/create-portal-session',
  authenticate,
  requireOrganization,
  async (req: AuthRequest, res: Response) => {
    try {
      const returnUrl = `${config.frontend.url}/subscription`;

      const session = await stripeService.createPortalSession(
        req.user!.organizationId!,
        returnUrl
      );

      res.json({ url: session.url });
    } catch (error) {
      logger.error('Failed to create portal session', { error });
      res.status(500).json({ error: 'Failed to create portal session' });
    }
  }
);

router.get(
  '/subscription',
  authenticate,
  requireOrganization,
  async (req: AuthRequest, res: Response) => {
    try {
      const subscription = await stripeService.getSubscription(req.user!.organizationId!);

      if (!subscription) {
        return res.json({ subscription: null });
      }

      res.json({ subscription });
    } catch (error) {
      logger.error('Failed to get subscription', { error });
      res.status(500).json({ error: 'Failed to get subscription' });
    }
  }
);

router.post(
  '/cancel-subscription',
  authenticate,
  requireOrganization,
  async (req: AuthRequest, res: Response) => {
    try {
      const { immediate } = req.body;

      await stripeService.cancelSubscription(req.user!.organizationId!, immediate);

      res.json({ success: true, message: 'Subscription cancellation requested' });
    } catch (error) {
      logger.error('Failed to cancel subscription', { error });
      res.status(500).json({ error: 'Failed to cancel subscription' });
    }
  }
);

router.post('/webhook', async (req: Request, res: Response) => {
  try {
    const signature = req.headers['stripe-signature'];

    if (!signature) {
      return res.status(400).json({ error: 'Missing stripe-signature header' });
    }

    await stripeService.handleWebhook(req.body, signature as string);

    res.json({ received: true });
  } catch (error) {
    logger.error('Webhook processing failed', { error });
    res.status(400).json({ error: 'Webhook processing failed' });
  }
});

export default router;

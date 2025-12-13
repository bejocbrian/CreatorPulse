import Stripe from 'stripe';
import { config } from '../config';
import { logger } from '../utils/logger';
import prisma from '../db/client';
import { AppError } from '../middleware/errorHandler';

const stripe = new Stripe(config.stripe.secretKey, {
  apiVersion: '2023-10-16',
});

export class StripeService {
  async createCheckoutSession(
    organizationId: string,
    priceId: string,
    successUrl: string,
    cancelUrl: string
  ) {
    try {
      const organization = await prisma.organization.findUnique({
        where: { id: organizationId },
      });

      if (!organization) {
        throw new AppError('Organization not found', 404);
      }

      let customerId = organization.stripeCustomerId;

      if (!customerId) {
        const customer = await stripe.customers.create({
          metadata: {
            organizationId: organization.id,
          },
          email: organization.name,
        });
        customerId = customer.id;

        await prisma.organization.update({
          where: { id: organizationId },
          data: { stripeCustomerId: customerId },
        });
      }

      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        payment_method_types: ['card'],
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        mode: 'subscription',
        success_url: successUrl,
        cancel_url: cancelUrl,
        metadata: {
          organizationId,
        },
      });

      logger.info('Checkout session created', {
        organizationId,
        sessionId: session.id,
      });

      return session;
    } catch (error) {
      logger.error('Failed to create checkout session', { error, organizationId });
      throw error;
    }
  }

  async createPortalSession(organizationId: string, returnUrl: string) {
    try {
      const organization = await prisma.organization.findUnique({
        where: { id: organizationId },
      });

      if (!organization?.stripeCustomerId) {
        throw new AppError('No active subscription found', 404);
      }

      const session = await stripe.billingPortal.sessions.create({
        customer: organization.stripeCustomerId,
        return_url: returnUrl,
      });

      logger.info('Portal session created', {
        organizationId,
        sessionId: session.id,
      });

      return session;
    } catch (error) {
      logger.error('Failed to create portal session', { error, organizationId });
      throw error;
    }
  }

  async handleWebhook(payload: Buffer, signature: string) {
    try {
      const event = stripe.webhooks.constructEvent(
        payload,
        signature,
        config.stripe.webhookSecret
      );

      logger.info('Stripe webhook received', {
        type: event.type,
        id: event.id,
      });

      switch (event.type) {
        case 'checkout.session.completed':
          await this.handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
          break;

        case 'customer.subscription.created':
        case 'customer.subscription.updated':
          await this.handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
          break;

        case 'customer.subscription.deleted':
          await this.handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
          break;

        case 'invoice.paid':
          await this.handleInvoicePaid(event.data.object as Stripe.Invoice);
          break;

        case 'invoice.payment_failed':
          await this.handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
          break;

        default:
          logger.info('Unhandled webhook event', { type: event.type });
      }

      return { received: true };
    } catch (error) {
      logger.error('Webhook processing failed', { error });
      throw error;
    }
  }

  private async handleCheckoutCompleted(session: Stripe.Checkout.Session) {
    const organizationId = session.metadata?.organizationId;

    if (!organizationId) {
      logger.error('No organizationId in checkout session metadata');
      return;
    }

    logger.info('Checkout completed', {
      organizationId,
      sessionId: session.id,
      subscriptionId: session.subscription,
    });
  }

  private async handleSubscriptionUpdated(subscription: Stripe.Subscription) {
    const customerId = subscription.customer as string;
    const organization = await prisma.organization.findUnique({
      where: { stripeCustomerId: customerId },
    });

    if (!organization) {
      logger.error('Organization not found for subscription', { customerId });
      return;
    }

    const tier = this.determineTier(subscription.items.data[0]?.price.id || '');

    await prisma.subscription.upsert({
      where: { stripeSubscriptionId: subscription.id },
      update: {
        status: subscription.status.toUpperCase() as any,
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        canceledAt: subscription.canceled_at ? new Date(subscription.canceled_at * 1000) : null,
        stripePriceId: subscription.items.data[0]?.price.id || '',
        stripeProductId: subscription.items.data[0]?.price.product as string || '',
      },
      create: {
        organizationId: organization.id,
        stripeSubscriptionId: subscription.id,
        stripePriceId: subscription.items.data[0]?.price.id || '',
        stripeProductId: subscription.items.data[0]?.price.product as string || '',
        status: subscription.status.toUpperCase() as any,
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
      },
    });

    await prisma.organization.update({
      where: { id: organization.id },
      data: { subscriptionTier: tier },
    });

    logger.info('Subscription updated', {
      organizationId: organization.id,
      subscriptionId: subscription.id,
      tier,
    });
  }

  private async handleSubscriptionDeleted(subscription: Stripe.Subscription) {
    const customerId = subscription.customer as string;
    const organization = await prisma.organization.findUnique({
      where: { stripeCustomerId: customerId },
    });

    if (!organization) {
      logger.error('Organization not found for subscription', { customerId });
      return;
    }

    await prisma.organization.update({
      where: { id: organization.id },
      data: { subscriptionTier: 'FREE' },
    });

    logger.info('Subscription deleted, reverted to FREE', {
      organizationId: organization.id,
    });
  }

  private async handleInvoicePaid(invoice: Stripe.Invoice) {
    if (!invoice.subscription) return;

    const subscription = await prisma.subscription.findUnique({
      where: { stripeSubscriptionId: invoice.subscription as string },
    });

    if (!subscription) {
      logger.error('Subscription not found for invoice', {
        invoiceId: invoice.id,
      });
      return;
    }

    await prisma.invoice.upsert({
      where: { stripeInvoiceId: invoice.id },
      update: {
        status: 'PAID',
        paidAt: invoice.status_transitions.paid_at
          ? new Date(invoice.status_transitions.paid_at * 1000)
          : null,
        hostedInvoiceUrl: invoice.hosted_invoice_url,
        invoicePdfUrl: invoice.invoice_pdf,
      },
      create: {
        subscriptionId: subscription.id,
        stripeInvoiceId: invoice.id,
        amount: invoice.amount_paid,
        currency: invoice.currency,
        status: 'PAID',
        paidAt: invoice.status_transitions.paid_at
          ? new Date(invoice.status_transitions.paid_at * 1000)
          : null,
        hostedInvoiceUrl: invoice.hosted_invoice_url,
        invoicePdfUrl: invoice.invoice_pdf,
      },
    });

    logger.info('Invoice paid', {
      invoiceId: invoice.id,
      subscriptionId: subscription.id,
    });
  }

  private async handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
    logger.warn('Invoice payment failed', {
      invoiceId: invoice.id,
      customerId: invoice.customer,
    });
  }

  private determineTier(priceId: string): 'FREE' | 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE' {
    const { starter, professional, enterprise } = config.stripe.prices;

    if (priceId === starter) return 'STARTER';
    if (priceId === professional) return 'PROFESSIONAL';
    if (priceId === enterprise) return 'ENTERPRISE';

    return 'FREE';
  }

  async getSubscription(organizationId: string) {
    const subscription = await prisma.subscription.findFirst({
      where: { organizationId },
      include: {
        organization: true,
      },
    });

    return subscription;
  }

  async cancelSubscription(organizationId: string, immediate: boolean = false) {
    const subscription = await prisma.subscription.findFirst({
      where: { organizationId },
    });

    if (!subscription) {
      throw new AppError('No active subscription found', 404);
    }

    await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
      cancel_at_period_end: !immediate,
    });

    if (immediate) {
      await stripe.subscriptions.cancel(subscription.stripeSubscriptionId);
    }

    logger.info('Subscription cancellation requested', {
      organizationId,
      immediate,
    });

    return subscription;
  }
}

export const stripeService = new StripeService();

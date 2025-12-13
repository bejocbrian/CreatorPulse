import prisma from '../db/client';
import { logger } from '../utils/logger';
import { config } from '../config';

export class UsageService {
  async getOrganizationUsage(organizationId: string) {
    try {
      const [documentCount, documents, activeChecklists, totalChecklists] = await Promise.all([
        prisma.document.count({ where: { organizationId } }),
        prisma.document.findMany({
          where: { organizationId },
          select: { fileSize: true },
        }),
        prisma.checklist.count({
          where: { organizationId, status: 'ACTIVE' },
        }),
        prisma.checklist.count({ where: { organizationId } }),
      ]);

      const storageUsedBytes = documents.reduce((sum, doc) => sum + doc.fileSize, 0);

      logger.info('Usage metrics retrieved', {
        organizationId,
        documentCount,
        storageUsedBytes,
        activeChecklists,
      });

      return {
        documentCount,
        storageUsedBytes,
        storageUsedMB: Math.round(storageUsedBytes / (1024 * 1024)),
        activeChecklistCount: activeChecklists,
        totalChecklistCount: totalChecklists,
      };
    } catch (error) {
      logger.error('Failed to get usage metrics', { error, organizationId });
      throw error;
    }
  }

  async recordUsageMetrics(organizationId: string) {
    try {
      const usage = await this.getOrganizationUsage(organizationId);
      const period = new Date();
      period.setHours(0, 0, 0, 0);

      await prisma.usageMetrics.upsert({
        where: {
          organizationId_period: {
            organizationId,
            period,
          },
        },
        update: {
          documentCount: usage.documentCount,
          storageUsedBytes: usage.storageUsedBytes,
          activeChecklistCount: usage.activeChecklistCount,
          totalChecklistCount: usage.totalChecklistCount,
        },
        create: {
          organizationId,
          period,
          documentCount: usage.documentCount,
          storageUsedBytes: usage.storageUsedBytes,
          activeChecklistCount: usage.activeChecklistCount,
          totalChecklistCount: usage.totalChecklistCount,
        },
      });

      logger.info('Usage metrics recorded', { organizationId, period });

      return usage;
    } catch (error) {
      logger.error('Failed to record usage metrics', { error, organizationId });
      throw error;
    }
  }

  async checkLimits(organizationId: string) {
    try {
      const organization = await prisma.organization.findUnique({
        where: { id: organizationId },
      });

      if (!organization) {
        throw new Error('Organization not found');
      }

      const usage = await this.getOrganizationUsage(organizationId);
      const limits = config.subscriptionLimits[organization.subscriptionTier];

      const isWithinLimits = {
        documents:
          limits.documents === -1 || usage.documentCount < limits.documents,
        storage:
          limits.storageMB === -1 || usage.storageUsedMB < limits.storageMB,
        checklists:
          limits.checklists === -1 || usage.activeChecklistCount < limits.checklists,
      };

      const withinAllLimits =
        isWithinLimits.documents && isWithinLimits.storage && isWithinLimits.checklists;

      logger.info('Limits checked', {
        organizationId,
        tier: organization.subscriptionTier,
        usage,
        limits,
        isWithinLimits,
      });

      return {
        usage,
        limits,
        isWithinLimits,
        withinAllLimits,
      };
    } catch (error) {
      logger.error('Failed to check limits', { error, organizationId });
      throw error;
    }
  }

  async getUsageHistory(organizationId: string, days: number = 30) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const metrics = await prisma.usageMetrics.findMany({
        where: {
          organizationId,
          period: {
            gte: startDate,
          },
        },
        orderBy: {
          period: 'asc',
        },
      });

      logger.info('Usage history retrieved', {
        organizationId,
        days,
        recordCount: metrics.length,
      });

      return metrics;
    } catch (error) {
      logger.error('Failed to get usage history', { error, organizationId });
      throw error;
    }
  }
}

export const usageService = new UsageService();

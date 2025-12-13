import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

const prisma = new PrismaClient({
  log: [
    {
      emit: 'event',
      level: 'query',
    },
    {
      emit: 'event',
      level: 'error',
    },
    {
      emit: 'event',
      level: 'warn',
    },
  ],
});

prisma.$on('query', (e: any) => {
  logger.debug('Database Query', {
    query: e.query,
    duration: `${e.duration}ms`,
  });
});

prisma.$on('error', (e: any) => {
  logger.error('Database Error', {
    message: e.message,
    target: e.target,
  });
});

prisma.$on('warn', (e: any) => {
  logger.warn('Database Warning', {
    message: e.message,
  });
});

export default prisma;

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default prisma;

export async function disconnectDatabase() {
  await prisma.$disconnect();
}

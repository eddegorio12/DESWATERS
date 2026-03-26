import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

const adapter = new PrismaPg({ connectionString: 'postgresql://postgres:postgres@127.0.0.1:55432/dwds?schema=public' });
const prisma = new PrismaClient({ adapter });

const result = await prisma.user.update({
  where: { email: 'moontonng13@gmail.com' },
  data: { failedSignInCount: 0, lockedUntil: null },
  select: { email: true, failedSignInCount: true, lockedUntil: true }
});
console.log('Account unlocked:', result);
await prisma.$disconnect();

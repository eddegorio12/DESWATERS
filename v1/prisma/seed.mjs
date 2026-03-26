import bcrypt from "bcrypt";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, Role } from "@prisma/client";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required before running the seed.");
}

const adapter = new PrismaPg({ connectionString: databaseUrl });
const prisma = new PrismaClient({ adapter });

const seedAdminEmail = process.env.SEED_ADMIN_EMAIL?.trim().toLowerCase();
const seedAdminPassword = process.env.SEED_ADMIN_PASSWORD?.trim();
const seedAdminName =
  process.env.SEED_ADMIN_NAME?.trim() || "DWDS Super Admin";

if (!seedAdminEmail || !seedAdminPassword) {
  throw new Error(
    "Set SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD before running prisma db seed."
  );
}

async function main() {
  const existingAdmin = await prisma.user.findUnique({
    where: { email: seedAdminEmail },
    select: { id: true },
  });

  if (existingAdmin) {
    console.info(`[seed] Super admin already exists for ${seedAdminEmail}.`);
    return;
  }

  const passwordHash = await bcrypt.hash(seedAdminPassword, 12);

  await prisma.user.create({
    data: {
      name: seedAdminName,
      email: seedAdminEmail,
      passwordHash,
      role: Role.SUPER_ADMIN,
      isActive: true,
    },
  });

  console.info(`[seed] Created SUPER_ADMIN account for ${seedAdminEmail}.`);
}

main()
  .catch((error) => {
    console.error("[seed] Failed to seed the first admin.", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

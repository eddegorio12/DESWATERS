import bcrypt from "bcrypt";
import { PrismaPg } from "@prisma/adapter-pg";
import {
  BillDistributionStatus,
  BillLifecycleStatus,
  BillStatus,
  PaymentMethod,
  PaymentStatus,
  PrismaClient,
  ReadingStatus,
  ReceivableFollowUpStatus,
  Role,
} from "@prisma/client";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required before running the seed.");
}

const adapter = new PrismaPg({ connectionString: databaseUrl });
const prisma = new PrismaClient({ adapter });

const seedAdminEmail = process.env.SEED_ADMIN_EMAIL?.trim().toLowerCase();
const seedAdminPassword = process.env.SEED_ADMIN_PASSWORD?.trim();
const seedAdminName = process.env.SEED_ADMIN_NAME?.trim() || "DWDS Super Admin";
const seedSampleData = /^(1|true|yes)$/i.test(process.env.SEED_SAMPLE_DATA?.trim() || "");
const seedSampleStaffPassword =
  process.env.SEED_SAMPLE_STAFF_PASSWORD?.trim() || "DwdsSample123!";

if (!seedAdminEmail || !seedAdminPassword) {
  throw new Error(
    "Set SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD before running prisma db seed."
  );
}

function addDays(baseDate, days) {
  return new Date(baseDate.getTime() + days * 86_400_000);
}

function formatBillingLabel(date) {
  return date.toLocaleDateString("en-PH", {
    month: "short",
    year: "numeric",
  });
}

function formatPeriodKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

async function ensureSuperAdmin() {
  const existingAdmin = await prisma.user.findUnique({
    where: { email: seedAdminEmail },
    select: { id: true, email: true },
  });

  if (existingAdmin) {
    console.info(`[seed] Super admin already exists for ${seedAdminEmail}.`);
    return existingAdmin;
  }

  const passwordHash = await bcrypt.hash(seedAdminPassword, 12);

  const admin = await prisma.user.create({
    data: {
      name: seedAdminName,
      email: seedAdminEmail,
      passwordHash,
      role: Role.SUPER_ADMIN,
      isActive: true,
    },
    select: {
      id: true,
      email: true,
    },
  });

  console.info(`[seed] Created SUPER_ADMIN account for ${seedAdminEmail}.`);
  return admin;
}

async function ensureStaffUsers() {
  const passwordHash = await bcrypt.hash(seedSampleStaffPassword, 12);
  const sampleUsers = [
    {
      email: "billing.lead@dwds.local",
      name: "Marites Billing",
      role: Role.BILLING,
    },
    {
      email: "cashier.main@dwds.local",
      name: "Ana Cashier",
      role: Role.CASHIER,
    },
    {
      email: "meter.reader@dwds.local",
      name: "Joel Reader",
      role: Role.METER_READER,
    },
    {
      email: "field.tech@dwds.local",
      name: "Ramon Technician",
      role: Role.TECHNICIAN,
    },
  ];

  const users = {};

  for (const sampleUser of sampleUsers) {
    const user = await prisma.user.upsert({
      where: {
        email: sampleUser.email,
      },
      update: {
        name: sampleUser.name,
        role: sampleUser.role,
        isActive: true,
      },
      create: {
        email: sampleUser.email,
        name: sampleUser.name,
        passwordHash,
        role: sampleUser.role,
        isActive: true,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    });

    users[sampleUser.role] = user;
  }

  console.info(
    `[seed] Ensured sample staff users with shared password ${seedSampleStaffPassword}.`
  );
  console.info("[seed] Sample staff accounts:");
  console.info("  - billing.lead@dwds.local (BILLING)");
  console.info("  - cashier.main@dwds.local (CASHIER)");
  console.info("  - meter.reader@dwds.local (METER_READER)");
  console.info("  - field.tech@dwds.local (TECHNICIAN)");
  console.info("  - password source: SEED_SAMPLE_STAFF_PASSWORD");

  return users;
}

async function ensureActiveTariff(createdById) {
  return prisma.tariff.upsert({
    where: {
      name: "DWDS Residential Standard 2026",
    },
    update: {
      isActive: true,
      version: 1,
      effectiveFrom: new Date("2026-01-01T00:00:00.000Z"),
      penaltyRate: 0.02,
      reconnectionFee: 150,
      minimumCharge: 180,
      minimumUsage: 10,
      installationFee: 3000,
      changeReason: "Initial realistic sample tariff for local DWDS operations seeding.",
      createdById,
      tiers: {
        deleteMany: {},
        create: [
          { minVolume: 0, maxVolume: 10, ratePerCuM: 18 },
          { minVolume: 10.01, maxVolume: 20, ratePerCuM: 22 },
          { minVolume: 20.01, maxVolume: null, ratePerCuM: 28 },
        ],
      },
    },
    create: {
      name: "DWDS Residential Standard 2026",
      isActive: true,
      version: 1,
      effectiveFrom: new Date("2026-01-01T00:00:00.000Z"),
      penaltyRate: 0.02,
      reconnectionFee: 150,
      minimumCharge: 180,
      minimumUsage: 10,
      installationFee: 3000,
      changeReason: "Initial realistic sample tariff for local DWDS operations seeding.",
      createdById,
      tiers: {
        create: [
          { minVolume: 0, maxVolume: 10, ratePerCuM: 18 },
          { minVolume: 10.01, maxVolume: 20, ratePerCuM: 22 },
          { minVolume: 20.01, maxVolume: null, ratePerCuM: 28 },
        ],
      },
    },
    include: {
      tiers: true,
    },
  });
}

function computeCharges(consumption, tariff) {
  let total = tariff.minimumCharge;
  let remaining = Math.max(0, consumption - tariff.minimumUsage);

  if (remaining <= 0) {
    return Number(total.toFixed(2));
  }

  for (const tier of tariff.tiers.sort((left, right) => left.minVolume - right.minVolume)) {
    if (remaining <= 0) {
      break;
    }

    const tierSpan =
      tier.maxVolume == null
        ? remaining
        : Math.max(0, tier.maxVolume - Math.max(tier.minVolume, tariff.minimumUsage));
    const applied = tier.maxVolume == null ? remaining : Math.min(remaining, tierSpan);

    if (applied > 0) {
      total += applied * tier.ratePerCuM;
      remaining -= applied;
    }
  }

  return Number(total.toFixed(2));
}

async function ensureBillingCycle(periodDate) {
  const periodKey = formatPeriodKey(periodDate);
  const billingPeriodLabel = formatBillingLabel(periodDate);

  return prisma.billingCycle.upsert({
    where: {
      periodKey,
    },
    update: {
      billingPeriodLabel,
    },
    create: {
      periodKey,
      billingPeriodLabel,
    },
    select: {
      id: true,
      periodKey: true,
      billingPeriodLabel: true,
    },
  });
}

async function ensureSampleOperations({ superAdminId, sampleStaff }) {
  const sampleAlreadyExists = await prisma.customer.findFirst({
    where: {
      accountNumber: {
        startsWith: "DWDS-SMP-",
      },
    },
    select: {
      id: true,
    },
  });

  if (sampleAlreadyExists) {
    console.info("[seed] Realistic sample operations data already exists. Skipping sample creation.");
    return;
  }

  const tariff = await ensureActiveTariff(superAdminId);

  const northZone = await prisma.serviceZone.upsert({
    where: { name: "North Service Zone" },
    update: {
      code: "NZ",
      description: "Sample residential cluster for upper-poblacion and highway households.",
    },
    create: {
      name: "North Service Zone",
      code: "NZ",
      description: "Sample residential cluster for upper-poblacion and highway households.",
    },
  });

  const eastZone = await prisma.serviceZone.upsert({
    where: { name: "East Service Zone" },
    update: {
      code: "EZ",
      description: "Sample residential cluster for riverside and market-adjacent households.",
    },
    create: {
      name: "East Service Zone",
      code: "EZ",
      description: "Sample residential cluster for riverside and market-adjacent households.",
    },
  });

  const routeNorthA = await prisma.serviceRoute.upsert({
    where: { code: "NZ-A" },
    update: {
      name: "North Route A",
      zoneId: northZone.id,
      description: "Upper road and barangay hall corridor.",
    },
    create: {
      code: "NZ-A",
      name: "North Route A",
      zoneId: northZone.id,
      description: "Upper road and barangay hall corridor.",
    },
  });

  const routeEastA = await prisma.serviceRoute.upsert({
    where: { code: "EZ-A" },
    update: {
      name: "East Route A",
      zoneId: eastZone.id,
      description: "Riverside homes and public market rear strip.",
    },
    create: {
      code: "EZ-A",
      name: "East Route A",
      zoneId: eastZone.id,
      description: "Riverside homes and public market rear strip.",
    },
  });

  await prisma.staffRouteAssignment.upsert({
    where: {
      userId_serviceRouteId_responsibility: {
        userId: sampleStaff.METER_READER.id,
        serviceRouteId: routeNorthA.id,
        responsibility: "METER_READING",
      },
    },
    update: {
      releasedAt: null,
      isPrimary: true,
    },
    create: {
      userId: sampleStaff.METER_READER.id,
      serviceRouteId: routeNorthA.id,
      responsibility: "METER_READING",
      isPrimary: true,
    },
  });

  await prisma.staffRouteAssignment.upsert({
    where: {
      userId_serviceRouteId_responsibility: {
        userId: sampleStaff.BILLING.id,
        serviceRouteId: routeNorthA.id,
        responsibility: "BILL_DISTRIBUTION",
      },
    },
    update: {
      releasedAt: null,
      isPrimary: true,
    },
    create: {
      userId: sampleStaff.BILLING.id,
      serviceRouteId: routeNorthA.id,
      responsibility: "BILL_DISTRIBUTION",
      isPrimary: true,
    },
  });

  const sampleCustomers = [
    {
      accountNumber: "DWDS-SMP-1001",
      name: "Elena Cruz",
      address: "Purok Santol, North Service Zone",
      contactNumber: "09171230001",
      email: "elena.cruz@example.local",
      zoneId: northZone.id,
      routeId: routeNorthA.id,
      meterNumber: "NZA-0001",
      installDate: "2025-11-10T00:00:00.000Z",
      billingPeriodDate: new Date("2026-01-01T00:00:00.000Z"),
      dueDate: new Date("2026-01-28T00:00:00.000Z"),
      previousReading: 1180,
      currentReading: 1198,
      followUpStatus: ReceivableFollowUpStatus.CURRENT,
      billStatus: BillStatus.OVERDUE,
      customerStatus: "ACTIVE",
      paymentAmount: 0,
    },
    {
      accountNumber: "DWDS-SMP-1002",
      name: "Mario Ramos",
      address: "Barangay Hall Road, North Service Zone",
      contactNumber: "09171230002",
      email: "mario.ramos@example.local",
      zoneId: northZone.id,
      routeId: routeNorthA.id,
      meterNumber: "NZA-0002",
      installDate: "2025-10-02T00:00:00.000Z",
      billingPeriodDate: new Date("2026-01-01T00:00:00.000Z"),
      dueDate: new Date("2026-01-24T00:00:00.000Z"),
      previousReading: 940,
      currentReading: 962,
      followUpStatus: ReceivableFollowUpStatus.REMINDER_SENT,
      billStatus: BillStatus.OVERDUE,
      customerStatus: "ACTIVE",
      paymentAmount: 0,
    },
    {
      accountNumber: "DWDS-SMP-1003",
      name: "Rosalina dela Pena",
      address: "Riverside Extension, East Service Zone",
      contactNumber: "09171230003",
      email: "rosalina.delapena@example.local",
      zoneId: eastZone.id,
      routeId: routeEastA.id,
      meterNumber: "EZA-0003",
      installDate: "2025-08-19T00:00:00.000Z",
      billingPeriodDate: new Date("2025-12-01T00:00:00.000Z"),
      dueDate: new Date("2026-01-18T00:00:00.000Z"),
      previousReading: 1550,
      currentReading: 1576,
      followUpStatus: ReceivableFollowUpStatus.FINAL_NOTICE_SENT,
      billStatus: BillStatus.OVERDUE,
      customerStatus: "ACTIVE",
      paymentAmount: 0,
    },
    {
      accountNumber: "DWDS-SMP-1004",
      name: "Teodoro Villanueva",
      address: "Public Market Rear, East Service Zone",
      contactNumber: "09171230004",
      email: "teodoro.villanueva@example.local",
      zoneId: eastZone.id,
      routeId: routeEastA.id,
      meterNumber: "EZA-0004",
      installDate: "2025-07-04T00:00:00.000Z",
      billingPeriodDate: new Date("2025-12-01T00:00:00.000Z"),
      dueDate: new Date("2026-01-10T00:00:00.000Z"),
      previousReading: 2105,
      currentReading: 2137,
      followUpStatus: ReceivableFollowUpStatus.DISCONNECTION_REVIEW,
      billStatus: BillStatus.OVERDUE,
      customerStatus: "ACTIVE",
      paymentAmount: 0,
    },
    {
      accountNumber: "DWDS-SMP-1005",
      name: "Luisa Santiago",
      address: "School Access Road, North Service Zone",
      contactNumber: "09171230005",
      email: "luisa.santiago@example.local",
      zoneId: northZone.id,
      routeId: routeNorthA.id,
      meterNumber: "NZA-0005",
      installDate: "2025-09-15T00:00:00.000Z",
      billingPeriodDate: new Date("2026-03-01T00:00:00.000Z"),
      dueDate: new Date("2026-04-05T00:00:00.000Z"),
      previousReading: 630,
      currentReading: 646,
      followUpStatus: ReceivableFollowUpStatus.CURRENT,
      billStatus: BillStatus.PARTIALLY_PAID,
      customerStatus: "ACTIVE",
      paymentAmount: 220,
    },
    {
      accountNumber: "DWDS-SMP-1006",
      name: "Rogelio Manalo",
      address: "Old Bridge Approach, East Service Zone",
      contactNumber: "09171230006",
      email: "rogelio.manalo@example.local",
      zoneId: eastZone.id,
      routeId: routeEastA.id,
      meterNumber: "EZA-0006",
      installDate: "2025-06-01T00:00:00.000Z",
      billingPeriodDate: new Date("2025-11-01T00:00:00.000Z"),
      dueDate: new Date("2025-12-12T00:00:00.000Z"),
      previousReading: 3200,
      currentReading: 3220,
      followUpStatus: ReceivableFollowUpStatus.DISCONNECTED,
      billStatus: BillStatus.OVERDUE,
      customerStatus: "DISCONNECTED",
      customerStatusNote: "Service is currently under hold pending account clearance.",
      paymentAmount: 0,
    },
  ];

  for (const sample of sampleCustomers) {
    const customer = await prisma.customer.create({
      data: {
        accountNumber: sample.accountNumber,
        name: sample.name,
        address: sample.address,
        contactNumber: sample.contactNumber,
        email: sample.email,
        status: sample.customerStatus,
        statusNote: sample.customerStatusNote || null,
        statusUpdatedAt: sample.customerStatus === "DISCONNECTED" ? new Date("2026-01-25T08:00:00.000Z") : null,
        statusUpdatedById: sample.customerStatus === "DISCONNECTED" ? superAdminId : null,
      },
    });

    const meter = await prisma.meter.create({
      data: {
        meterNumber: sample.meterNumber,
        installDate: new Date(sample.installDate),
        status: "ACTIVE",
        customerId: customer.id,
        serviceZoneId: sample.zoneId,
        serviceRouteId: sample.routeId,
      },
    });

    await prisma.meterHolderTransfer.create({
      data: {
        meterId: meter.id,
        toCustomerId: customer.id,
        effectiveDate: new Date(sample.installDate),
        reason: "Initial service connection assignment.",
      },
    });

    const readingDate = addDays(sample.billingPeriodDate, 25);
    const consumption = sample.currentReading - sample.previousReading;
    const totalCharges = computeCharges(consumption, tariff);
    const cycle = await ensureBillingCycle(sample.billingPeriodDate);

    const reading = await prisma.reading.create({
      data: {
        meterId: meter.id,
        readerId: sampleStaff.METER_READER.id,
        readingDate,
        previousReading: sample.previousReading,
        currentReading: sample.currentReading,
        consumption,
        status: ReadingStatus.APPROVED,
      },
    });

    const bill = await prisma.bill.create({
      data: {
        billingPeriod: cycle.billingPeriodLabel,
        billingCycleId: cycle.id,
        tariffId: tariff.id,
        dueDate: sample.dueDate,
        customerId: customer.id,
        readingId: reading.id,
        usageAmount: consumption,
        totalCharges,
        status: sample.billStatus,
        lifecycleStatus: BillLifecycleStatus.FINALIZED,
        finalizedAt: addDays(readingDate, 2),
        finalizedById: sampleStaff.BILLING.id,
        followUpStatus: sample.followUpStatus,
        followUpStatusUpdatedAt:
          sample.followUpStatus === ReceivableFollowUpStatus.CURRENT
            ? null
            : addDays(sample.dueDate, 7),
        followUpNote:
          sample.followUpStatus === ReceivableFollowUpStatus.CURRENT
            ? null
            : `Sample ${sample.followUpStatus.replaceAll("_", " ").toLowerCase()} entry created for realistic local follow-up seeding.`,
        followUpUpdatedById:
          sample.followUpStatus === ReceivableFollowUpStatus.CURRENT
            ? null
            : sampleStaff.BILLING.id,
        distributionStatus: BillDistributionStatus.DISTRIBUTED,
        printedAt: addDays(readingDate, 3),
        printedById: sampleStaff.BILLING.id,
        distributedAt: addDays(readingDate, 4),
        distributedById: sampleStaff.BILLING.id,
      },
    });

    if (sample.paymentAmount > 0) {
      await prisma.payment.create({
        data: {
          receiptNumber: `OR-${sample.accountNumber.slice(-4)}-01`,
          amount: sample.paymentAmount,
          paymentDate: addDays(sample.dueDate, -3),
          method: PaymentMethod.CASH,
          balanceBefore: totalCharges,
          balanceAfter: Number((totalCharges - sample.paymentAmount).toFixed(2)),
          recordedById: sampleStaff.CASHIER.id,
          billId: bill.id,
          status: PaymentStatus.COMPLETED,
        },
      });
    }
  }

  console.info("[seed] Created realistic sample operational data for follow-up, billing, and route workflows.");
}

async function main() {
  const superAdmin = await ensureSuperAdmin();
  console.info("[seed] Super admin account:");
  console.info(`  - ${seedAdminEmail} (SUPER_ADMIN)`);
  console.info("  - password source: SEED_ADMIN_PASSWORD");

  if (!seedSampleData) {
    console.info("[seed] Sample operational data skipped. Set SEED_SAMPLE_DATA=true to create realistic local entries.");
    return;
  }

  const sampleStaff = await ensureStaffUsers();
  await ensureSampleOperations({
    superAdminId: superAdmin.id,
    sampleStaff,
  });
}

main()
  .catch((error) => {
    console.error("[seed] Failed to seed the database.", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

import { Role } from "@prisma/client";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export type AdminModule =
  | "dashboard"
  | "staffAccess"
  | "customers"
  | "meters"
  | "tariffs"
  | "readings"
  | "billing"
  | "billPrint"
  | "payments"
  | "collections"
  | "followUp";

export type StaffCapability =
  | "admins:manage"
  | "customers:create"
  | "meters:register"
  | "meters:assign"
  | "meters:transfer"
  | "tariffs:create"
  | "readings:create"
  | "readings:approve"
  | "readings:delete:any"
  | "readings:delete:own"
  | "billing:generate"
  | "payments:record"
  | "followup:update"
  | "service:disconnect"
  | "service:reinstate";

const moduleAccess: Record<AdminModule, readonly Role[]> = {
  dashboard: [
    Role.SUPER_ADMIN,
    Role.ADMIN,
    Role.TECHNICIAN,
    Role.METER_READER,
    Role.BILLING,
    Role.CASHIER,
    Role.VIEWER,
  ],
  staffAccess: [Role.SUPER_ADMIN],
  customers: [Role.SUPER_ADMIN, Role.ADMIN, Role.TECHNICIAN],
  meters: [Role.SUPER_ADMIN, Role.ADMIN, Role.TECHNICIAN],
  tariffs: [Role.SUPER_ADMIN, Role.ADMIN, Role.BILLING],
  readings: [Role.SUPER_ADMIN, Role.ADMIN, Role.METER_READER, Role.BILLING],
  billing: [Role.SUPER_ADMIN, Role.ADMIN, Role.BILLING],
  billPrint: [Role.SUPER_ADMIN, Role.ADMIN, Role.BILLING, Role.CASHIER],
  payments: [Role.SUPER_ADMIN, Role.ADMIN, Role.CASHIER],
  collections: [Role.SUPER_ADMIN, Role.ADMIN, Role.BILLING, Role.CASHIER, Role.VIEWER],
  followUp: [Role.SUPER_ADMIN, Role.ADMIN, Role.BILLING],
};

const capabilityAccess: Record<StaffCapability, readonly Role[]> = {
  "admins:manage": [Role.SUPER_ADMIN],
  "customers:create": [Role.SUPER_ADMIN, Role.ADMIN, Role.TECHNICIAN],
  "meters:register": [Role.SUPER_ADMIN, Role.ADMIN, Role.TECHNICIAN],
  "meters:assign": [Role.SUPER_ADMIN, Role.ADMIN, Role.TECHNICIAN],
  "meters:transfer": [Role.SUPER_ADMIN, Role.ADMIN, Role.TECHNICIAN],
  "tariffs:create": [Role.SUPER_ADMIN, Role.ADMIN],
  "readings:create": [Role.SUPER_ADMIN, Role.ADMIN, Role.METER_READER],
  "readings:approve": [Role.SUPER_ADMIN, Role.ADMIN, Role.BILLING],
  "readings:delete:any": [Role.SUPER_ADMIN, Role.ADMIN],
  "readings:delete:own": [Role.SUPER_ADMIN, Role.ADMIN, Role.METER_READER],
  "billing:generate": [Role.SUPER_ADMIN, Role.ADMIN, Role.BILLING],
  "payments:record": [Role.SUPER_ADMIN, Role.ADMIN, Role.CASHIER],
  "followup:update": [Role.SUPER_ADMIN, Role.ADMIN, Role.BILLING],
  "service:disconnect": [Role.SUPER_ADMIN, Role.ADMIN],
  "service:reinstate": [Role.SUPER_ADMIN, Role.ADMIN],
};

const moduleLabels: Record<AdminModule, string> = {
  dashboard: "dashboard",
  staffAccess: "admin management",
  customers: "customer operations",
  meters: "meter operations",
  tariffs: "tariff controls",
  readings: "reading operations",
  billing: "billing controls",
  billPrint: "bill printing",
  payments: "cashier posting",
  collections: "collections reporting",
  followUp: "receivables follow-up",
};

const capabilityLabels: Record<StaffCapability, string> = {
  "admins:manage": "manage admin accounts",
  "customers:create": "create customer records",
  "meters:register": "register meters",
  "meters:assign": "assign meters",
  "meters:transfer": "transfer meter holders",
  "tariffs:create": "change tariff rules",
  "readings:create": "encode meter readings",
  "readings:approve": "approve meter readings",
  "readings:delete:any": "delete pending readings",
  "readings:delete:own": "delete your pending readings",
  "billing:generate": "generate bills",
  "payments:record": "record payments",
  "followup:update": "update receivables follow-up",
  "service:disconnect": "disconnect service accounts",
  "service:reinstate": "reinstate service accounts",
};

export const roleDisplayName: Record<Role, string> = {
  SUPER_ADMIN: "Super Admin",
  ADMIN: "Admin",
  CASHIER: "Cashier",
  BILLING: "Billing",
  METER_READER: "Meter Reader",
  TECHNICIAN: "Technician",
  VIEWER: "Viewer",
};

export const roleSummaries: Record<Role, string> = {
  SUPER_ADMIN: "Full access across every DWDS module, including admin account management.",
  ADMIN: "Operational control across customer, billing, metering, cashier, and follow-up work.",
  CASHIER: "Cashier posting and collections monitoring without customer or billing mutations.",
  BILLING:
    "Tariff visibility, reading approval, bill generation, collections visibility, and receivables follow-up updates.",
  METER_READER:
    "Reading entry access plus deletion of their own pending submissions before review.",
  TECHNICIAN:
    "Customer and meter maintenance access without cashier, billing, or tariff authority.",
  VIEWER: "Read-only access to the dashboard and reporting surfaces.",
};

export type CurrentStaffUser = {
  id: string;
  email: string;
  name: string;
  mustChangePassword: boolean;
  role: Role;
  isActive: boolean;
  lastLoginAt: Date | null;
};

export type ModuleAccessState =
  | { status: "signed_out" }
  | { status: "password_change_required"; user: CurrentStaffUser }
  | { status: "inactive"; user: CurrentStaffUser }
  | { status: "forbidden"; user: CurrentStaffUser }
  | { status: "authorized"; user: CurrentStaffUser };

export async function getCurrentStaffUser() {
  const session = await auth();

  if (!session?.user?.id) {
    return { isAuthenticated: false as const, user: null };
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      email: true,
      name: true,
      mustChangePassword: true,
      role: true,
      isActive: true,
      lastLoginAt: true,
    },
  });

  if (!user) {
    return { isAuthenticated: false as const, user: null };
  }

  return {
    isAuthenticated: true as const,
    user,
  };
}

export function canAccessAdminModule(role: Role, module: AdminModule) {
  return moduleAccess[module].includes(role);
}

export function canPerformCapability(role: Role, capability: StaffCapability) {
  return capabilityAccess[capability].includes(role);
}

export function getAccessibleAdminModules(role: Role) {
  return (Object.keys(moduleAccess) as AdminModule[]).filter((module) =>
    canAccessAdminModule(role, module)
  );
}

export async function getModuleAccess(module: AdminModule): Promise<ModuleAccessState> {
  const current = await getCurrentStaffUser();

  if (!current.isAuthenticated || !current.user) {
    return { status: "signed_out" };
  }

  if (!current.user.isActive) {
    return { status: "inactive", user: current.user };
  }

  if (current.user.mustChangePassword) {
    return { status: "password_change_required", user: current.user };
  }

  if (!canAccessAdminModule(current.user.role, module)) {
    return { status: "forbidden", user: current.user };
  }

  return { status: "authorized", user: current.user };
}

export async function requireStaffCapability(capability: StaffCapability) {
  const current = await getCurrentStaffUser();

  if (!current.isAuthenticated || !current.user) {
    throw new Error("You must be signed in to continue.");
  }

  if (!current.user.isActive) {
    throw new Error("Your DWDS admin account is inactive. Ask a SUPER_ADMIN to reactivate it.");
  }

  if (current.user.mustChangePassword) {
    throw new Error("You must change your temporary password before accessing this action.");
  }

  if (!canPerformCapability(current.user.role, capability)) {
    throw new Error(`You are not authorized to ${capabilityLabels[capability]}.`);
  }

  return current.user;
}

export function getForbiddenModuleMessage(role: Role, module: AdminModule) {
  return `Your ${roleDisplayName[role]} role does not include ${moduleLabels[module]}.`;
}

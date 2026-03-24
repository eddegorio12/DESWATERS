import { auth } from "@clerk/nextjs/server";
import { Role, StaffApprovalStatus } from "@prisma/client";

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
  | "staff:approve"
  | "customers:create"
  | "meters:register"
  | "meters:assign"
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
    Role.ADMIN,
    Role.MANAGER,
    Role.CUSTOMER_SERVICE,
    Role.METER_READER,
    Role.BILLING_STAFF,
    Role.CASHIER,
  ],
  staffAccess: [Role.ADMIN, Role.MANAGER],
  customers: [Role.ADMIN, Role.MANAGER, Role.CUSTOMER_SERVICE],
  meters: [Role.ADMIN, Role.MANAGER, Role.CUSTOMER_SERVICE],
  tariffs: [Role.ADMIN, Role.MANAGER, Role.BILLING_STAFF],
  readings: [Role.ADMIN, Role.MANAGER, Role.METER_READER, Role.BILLING_STAFF],
  billing: [Role.ADMIN, Role.MANAGER, Role.BILLING_STAFF],
  billPrint: [Role.ADMIN, Role.MANAGER, Role.BILLING_STAFF, Role.CASHIER],
  payments: [Role.ADMIN, Role.MANAGER, Role.CASHIER],
  collections: [Role.ADMIN, Role.MANAGER, Role.BILLING_STAFF, Role.CASHIER],
  followUp: [Role.ADMIN, Role.MANAGER, Role.BILLING_STAFF],
};

const capabilityAccess: Record<StaffCapability, readonly Role[]> = {
  "staff:approve": [Role.ADMIN, Role.MANAGER],
  "customers:create": [Role.ADMIN, Role.MANAGER, Role.CUSTOMER_SERVICE],
  "meters:register": [Role.ADMIN, Role.MANAGER, Role.CUSTOMER_SERVICE],
  "meters:assign": [Role.ADMIN, Role.MANAGER, Role.CUSTOMER_SERVICE],
  "tariffs:create": [Role.ADMIN, Role.MANAGER],
  "readings:create": [Role.ADMIN, Role.MANAGER, Role.METER_READER],
  "readings:approve": [Role.ADMIN, Role.MANAGER, Role.BILLING_STAFF],
  "readings:delete:any": [Role.ADMIN, Role.MANAGER],
  "readings:delete:own": [Role.ADMIN, Role.MANAGER, Role.METER_READER],
  "billing:generate": [Role.ADMIN, Role.MANAGER, Role.BILLING_STAFF],
  "payments:record": [Role.ADMIN, Role.MANAGER, Role.CASHIER],
  "followup:update": [Role.ADMIN, Role.MANAGER, Role.BILLING_STAFF],
  "service:disconnect": [Role.ADMIN, Role.MANAGER],
  "service:reinstate": [Role.ADMIN, Role.MANAGER],
};

const moduleLabels: Record<AdminModule, string> = {
  dashboard: "dashboard",
  staffAccess: "staff access approvals",
  customers: "customer operations",
  meters: "meter operations",
  tariffs: "tariff controls",
  readings: "reading operations",
  billing: "billing controls",
  billPrint: "bill templates",
  payments: "cashier posting",
  collections: "collections reporting",
  followUp: "receivables follow-up",
};

const capabilityLabels: Record<StaffCapability, string> = {
  "staff:approve": "approve staff access",
  "customers:create": "create customer records",
  "meters:register": "register meters",
  "meters:assign": "assign meters",
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
  ADMIN: "Admin",
  MANAGER: "Manager",
  CUSTOMER_SERVICE: "Customer Service",
  METER_READER: "Meter Reader",
  BILLING_STAFF: "Billing Staff",
  CASHIER: "Cashier",
};

export const roleSummaries: Record<Role, string> = {
  ADMIN: "Full access across all DWDS operations modules and sensitive staff actions.",
  MANAGER: "Operational oversight across all modules with approval and settlement authority.",
  CUSTOMER_SERVICE:
    "Customer and meter maintenance only, without billing, collections, or cashier mutations.",
  METER_READER:
    "Reading entry access plus deletion of their own pending submissions before review.",
  BILLING_STAFF:
    "Tariff visibility, reading approval, billing generation, collections visibility, and receivables follow-up updates.",
  CASHIER:
    "Cashier posting and collections monitoring without customer setup or billing mutations.",
};

type CurrentStaffUser = {
  id: string;
  clerkId: string;
  email: string;
  name: string;
  role: Role;
  active: boolean;
  approvalStatus: StaffApprovalStatus;
};

export type ModuleAccessState =
  | { status: "signed_out" }
  | { status: "missing_profile" }
  | { status: "pending"; user: CurrentStaffUser }
  | { status: "rejected"; user: CurrentStaffUser }
  | { status: "inactive"; user: CurrentStaffUser }
  | { status: "forbidden"; user: CurrentStaffUser }
  | { status: "authorized"; user: CurrentStaffUser };

async function getCurrentStaffUser() {
  const { userId, isAuthenticated } = await auth();

  if (!isAuthenticated || !userId) {
    return { isAuthenticated: false as const, user: null };
  }

  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
    select: {
      id: true,
      clerkId: true,
      email: true,
      name: true,
      role: true,
      active: true,
      approvalStatus: true,
    },
  });

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

  if (!current.isAuthenticated) {
    return { status: "signed_out" };
  }

  if (!current.user) {
    return { status: "missing_profile" };
  }

  if (current.user.approvalStatus === StaffApprovalStatus.PENDING) {
    return { status: "pending", user: current.user };
  }

  if (current.user.approvalStatus === StaffApprovalStatus.REJECTED) {
    return { status: "rejected", user: current.user };
  }

  if (!current.user.active) {
    return { status: "inactive", user: current.user };
  }

  if (!canAccessAdminModule(current.user.role, module)) {
    return { status: "forbidden", user: current.user };
  }

  return { status: "authorized", user: current.user };
}

export async function requireStaffCapability(capability: StaffCapability) {
  const current = await getCurrentStaffUser();

  if (!current.isAuthenticated) {
    throw new Error("You must be signed in to continue.");
  }

  if (!current.user) {
    throw new Error(
      "Your local staff profile is unavailable. Re-open the dashboard and let account sync complete."
    );
  }

  if (current.user.approvalStatus === StaffApprovalStatus.PENDING) {
    throw new Error("Your staff access request is still pending admin or manager approval.");
  }

  if (current.user.approvalStatus === StaffApprovalStatus.REJECTED) {
    throw new Error("Your staff access request was rejected. Contact an administrator.");
  }

  if (!current.user.active) {
    throw new Error("Your approved DWDS staff profile is inactive. Ask an administrator to reactivate it.");
  }

  if (!canPerformCapability(current.user.role, capability)) {
    throw new Error(`You are not authorized to ${capabilityLabels[capability]}.`);
  }

  return current.user;
}

export function getForbiddenModuleMessage(role: Role, module: AdminModule) {
  return `Your ${roleDisplayName[role]} role does not include ${moduleLabels[module]}.`;
}

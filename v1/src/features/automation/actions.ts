"use server";

import { AutomationApprovalStatus, AutomationRunStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";

import { requireStaffCapability } from "@/features/auth/lib/authorization";
import { prisma } from "@/lib/prisma";

import { retryTelegramApprovalRequestDelivery } from "./lib/approval-store";

function revalidateAutomationSurfaces() {
  revalidatePath("/admin/automation");
  revalidatePath("/admin/follow-up");
  revalidatePath("/admin/exceptions");
  revalidatePath("/admin/payments");
}

export async function expireStaleAutomationRuns() {
  await requireStaffCapability("automation:supervise");

  const now = new Date();
  const staleRuns = await prisma.automationRun.findMany({
    where: {
      status: AutomationRunStatus.PENDING,
      leaseExpiresAt: {
        lte: now,
      },
    },
    select: {
      id: true,
      deadLetteredAt: true,
      failureReason: true,
    },
  });

  if (!staleRuns.length) {
    revalidateAutomationSurfaces();
    return;
  }

  await Promise.all(
    staleRuns.map((run) =>
      prisma.automationRun.update({
        where: {
          id: run.id,
        },
        data: {
          status: AutomationRunStatus.FAILED,
          failureReason: run.failureReason ?? "Supervisor expired a stale automation run lease.",
          leaseOwner: null,
          leaseExpiresAt: null,
          completedAt: now,
          deadLetteredAt: run.deadLetteredAt ?? now,
          deadLetterReason: "Supervisor expired a stale automation run lease.",
        },
      })
    )
  );

  revalidateAutomationSurfaces();
}

export async function expirePendingAutomationApprovals() {
  await requireStaffCapability("automation:supervise");

  const now = new Date();
  await prisma.automationApprovalRequest.updateMany({
    where: {
      status: AutomationApprovalStatus.PENDING,
      expiresAt: {
        lte: now,
      },
    },
    data: {
      status: AutomationApprovalStatus.EXPIRED,
      decidedAt: now,
      decidedByLabel: "DWDS automation supervisor",
    },
  });

  revalidateAutomationSurfaces();
}

export async function retryAutomationApprovalDelivery(formData: FormData) {
  const actor = await requireStaffCapability("automation:supervise");
  const requestId = String(formData.get("requestId") ?? "").trim();

  if (!requestId) {
    throw new Error("Missing automation approval request ID.");
  }

  await retryTelegramApprovalRequestDelivery({
    requestId,
    supervisorLabel: `${actor.name} via automation supervision`,
  });

  revalidateAutomationSurfaces();
}

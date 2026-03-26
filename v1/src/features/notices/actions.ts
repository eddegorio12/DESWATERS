"use server";

import {
  BillStatus,
  NotificationTemplate,
  PaymentStatus,
} from "@prisma/client";
import { revalidatePath } from "next/cache";

import { requireStaffCapability } from "@/features/auth/lib/authorization";
import {
  getOperationalBillStatus,
  getOutstandingBalance,
} from "@/features/follow-up/lib/workflow";
import { createPrintedNoticeLog } from "@/features/notices/lib/logging";
import { prisma } from "@/lib/prisma";

const supportedBillNoticeTemplates = new Set<NotificationTemplate>([
  NotificationTemplate.BILLING_REMINDER,
  NotificationTemplate.FOLLOW_UP_REMINDER,
  NotificationTemplate.FINAL_NOTICE,
  NotificationTemplate.DISCONNECTION,
]);

export async function generatePrintableBillNotice(
  billId: string,
  template: NotificationTemplate
) {
  const staffUser = await requireStaffCapability("billing:print");

  if (!supportedBillNoticeTemplates.has(template)) {
    throw new Error("That notice template is not available from a billing-linked record.");
  }

  const bill = await prisma.bill.findUnique({
    where: {
      id: billId,
    },
    select: {
      id: true,
      billingPeriod: true,
      dueDate: true,
      totalCharges: true,
      status: true,
      followUpStatus: true,
      customer: {
        select: {
          id: true,
          name: true,
          accountNumber: true,
        },
      },
      payments: {
        where: {
          status: PaymentStatus.COMPLETED,
        },
        select: {
          amount: true,
        },
      },
    },
  });

  if (!bill) {
    throw new Error("That billing record no longer exists.");
  }

  const outstandingBalance = getOutstandingBalance(bill.totalCharges, bill.payments);
  const operationalStatus = getOperationalBillStatus(bill);

  if (outstandingBalance <= 0) {
    throw new Error("Printable notices are only available for bills with an open balance.");
  }

  if (
    template !== NotificationTemplate.BILLING_REMINDER &&
    operationalStatus !== BillStatus.OVERDUE
  ) {
    throw new Error("Escalated notices can only be generated for overdue receivables.");
  }

  if (
    template === NotificationTemplate.DISCONNECTION &&
    bill.followUpStatus !== "DISCONNECTED"
  ) {
    throw new Error("Disconnection notices are only available after service disconnection is recorded.");
  }

  const notice = await createPrintedNoticeLog({
    customer: {
      id: bill.customer.id,
      name: bill.customer.name,
      accountNumber: bill.customer.accountNumber,
    },
    bill: {
      id: bill.id,
      billingPeriod: bill.billingPeriod,
      dueDate: bill.dueDate,
      outstandingBalance,
    },
    template,
    triggeredById: staffUser.id,
  });

  revalidatePath("/admin/billing");
  revalidatePath(`/admin/billing/${bill.id}`);
  revalidatePath("/admin/follow-up");
  revalidatePath(`/admin/notices/${notice.id}`);

  return notice.id;
}

export async function generatePrintableCustomerNotice(
  customerId: string,
  template: "REINSTATEMENT" | "SERVICE_INTERRUPTION"
) {
  const staffUser = await requireStaffCapability("billing:print");

  const customer = await prisma.customer.findUnique({
    where: {
      id: customerId,
    },
    select: {
      id: true,
      name: true,
      accountNumber: true,
    },
  });

  if (!customer) {
    throw new Error("That customer record no longer exists.");
  }

  const notice = await createPrintedNoticeLog({
    customer,
    template,
    triggeredById: staffUser.id,
  });

  revalidatePath("/admin/follow-up");
  revalidatePath(`/admin/notices/${notice.id}`);

  return notice.id;
}

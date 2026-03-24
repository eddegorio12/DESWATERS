import type { BillStatus } from "@prisma/client";

import { getTodayCollectionRange } from "@/features/reports/lib/collections";

export type OpenReceivableBill = {
  id: string;
  billingPeriod: string;
  dueDate: Date;
  totalCharges: number;
  status: BillStatus;
  customer: {
    accountNumber: string;
    name: string;
  };
  reading: {
    meter: {
      meterNumber: string;
    };
  };
  payments: {
    amount: number;
  }[];
};

export type ReceivableStatus = "UNPAID" | "PARTIALLY_PAID" | "OVERDUE";

export type ReceivableAccount = {
  id: string;
  billingPeriod: string;
  dueDate: Date;
  totalCharges: number;
  paidAmount: number;
  outstandingBalance: number;
  customer: OpenReceivableBill["customer"];
  reading: OpenReceivableBill["reading"];
  status: ReceivableStatus;
  daysPastDue: number;
  daysUntilDue: number;
};

function roundCurrency(value: number) {
  return Math.round(value * 100) / 100;
}

function getDayDifference(laterDate: Date, earlierDate: Date) {
  return Math.floor((laterDate.getTime() - earlierDate.getTime()) / 86_400_000);
}

export function summarizeReceivables(bills: OpenReceivableBill[], now = new Date()) {
  const { start: todayStart } = getTodayCollectionRange(now);

  const accounts = bills
    .map((bill) => {
      const paidAmount = roundCurrency(
        bill.payments.reduce((sum, payment) => sum + payment.amount, 0)
      );
      const outstandingBalance = roundCurrency(
        Math.max(0, bill.totalCharges - paidAmount)
      );

      if (outstandingBalance <= 0) {
        return null;
      }

      const isOverdue = bill.dueDate.getTime() < todayStart.getTime();
      const status: ReceivableStatus = isOverdue
        ? "OVERDUE"
        : paidAmount > 0
          ? "PARTIALLY_PAID"
          : "UNPAID";

      return {
        id: bill.id,
        billingPeriod: bill.billingPeriod,
        dueDate: bill.dueDate,
        totalCharges: bill.totalCharges,
        paidAmount,
        outstandingBalance,
        customer: bill.customer,
        reading: bill.reading,
        status,
        daysPastDue: isOverdue ? getDayDifference(todayStart, bill.dueDate) : 0,
        daysUntilDue: isOverdue ? 0 : Math.max(0, getDayDifference(bill.dueDate, todayStart)),
      } satisfies ReceivableAccount;
    })
    .filter((account): account is ReceivableAccount => account !== null)
    .sort((left, right) => {
      const statusWeight = {
        OVERDUE: 0,
        PARTIALLY_PAID: 1,
        UNPAID: 2,
      } satisfies Record<ReceivableStatus, number>;

      const statusDifference = statusWeight[left.status] - statusWeight[right.status];

      if (statusDifference !== 0) {
        return statusDifference;
      }

      return left.dueDate.getTime() - right.dueDate.getTime();
    });

  const overdueAccounts = accounts.filter((account) => account.status === "OVERDUE");
  const partiallyPaidAccounts = accounts.filter(
    (account) => account.status === "PARTIALLY_PAID"
  );
  const unpaidAccounts = accounts.filter((account) => account.status === "UNPAID");
  const overdueCustomerCount = new Set(
    overdueAccounts.map((account) => account.customer.accountNumber)
  ).size;

  return {
    accounts,
    totalOutstanding: roundCurrency(
      accounts.reduce((sum, account) => sum + account.outstandingBalance, 0)
    ),
    overdueBalance: roundCurrency(
      overdueAccounts.reduce((sum, account) => sum + account.outstandingBalance, 0)
    ),
    unpaidBalance: roundCurrency(
      unpaidAccounts.reduce((sum, account) => sum + account.outstandingBalance, 0)
    ),
    partiallyPaidBalance: roundCurrency(
      partiallyPaidAccounts.reduce((sum, account) => sum + account.outstandingBalance, 0)
    ),
    overdueCount: overdueAccounts.length,
    unpaidCount: unpaidAccounts.length,
    partiallyPaidCount: partiallyPaidAccounts.length,
    overdueCustomerCount,
  };
}

"use server";
import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { requireStaffCapability } from "@/features/auth/lib/authorization";

import {
  customerFormSchema,
  type CustomerFormInput,
} from "@/features/customers/lib/customer-schema";

function createAccountNumber() {
  const year = new Date().getFullYear();
  const token = crypto.randomUUID().replace(/-/g, "").slice(0, 8).toUpperCase();

  return `CUST-${year}-${token}`;
}

export async function createCustomer(values: CustomerFormInput) {
  await requireStaffCapability("customers:create");

  const parsedValues = customerFormSchema.safeParse(values);

  if (!parsedValues.success) {
    throw new Error(parsedValues.error.issues[0]?.message || "Invalid customer data.");
  }

  const customer = await prisma.customer.create({
    data: {
      accountNumber: createAccountNumber(),
      ...parsedValues.data,
    },
    select: {
      id: true,
      accountNumber: true,
    },
  });

  revalidatePath("/admin/customers");
  revalidatePath("/admin/dashboard");

  return customer;
}

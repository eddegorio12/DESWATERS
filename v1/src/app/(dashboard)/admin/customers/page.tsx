import { AdminPageActions } from "@/features/admin/components/admin-page-actions";
import { AdminPageShell } from "@/features/admin/components/admin-page-shell";
import { ModuleAccessStateView } from "@/features/admin/components/module-access-state";
import {
  getSearchParamText,
  matchesSearch,
  type SearchParamValue,
} from "@/features/admin/lib/list-filters";
import { getModuleAccess } from "@/features/auth/lib/authorization";
import { CustomerForm } from "@/features/customers/components/customer-form";
import { CustomerList } from "@/features/customers/components/customer-list";
import { prisma } from "@/lib/prisma";

type CustomerPageProps = {
  searchParams: Promise<Record<string, SearchParamValue>>;
};

export default async function AdminCustomersPage({ searchParams }: CustomerPageProps) {
  const access = await getModuleAccess("customers");

  if (access.status !== "authorized") {
    return <ModuleAccessStateView module="customers" access={access} />;
  }

  const customers = await prisma.customer.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      accountNumber: true,
      name: true,
      address: true,
      contactNumber: true,
      email: true,
      status: true,
      createdAt: true,
      meters: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          meterNumber: true,
          status: true,
          holderTransfers: {
            orderBy: [{ effectiveDate: "desc" }, { createdAt: "desc" }],
            take: 1,
            select: {
              id: true,
              effectiveDate: true,
            },
          },
        },
      },
    },
  });

  const filters = await searchParams;
  const query = getSearchParamText(filters.query);
  const status = getSearchParamText(filters.status) as "ALL" | "ACTIVE" | "INACTIVE" | "DISCONNECTED";
  const filteredCustomers = customers.filter((customer) => {
    const matchesStatus = !status || status === "ALL" ? true : customer.status === status;

    return (
      matchesStatus &&
      matchesSearch(
        [
          customer.accountNumber,
          customer.name,
          customer.address,
          customer.contactNumber,
          customer.email,
        ],
        query
      )
    );
  });

  const linkedMeterCount = customers.reduce((sum, customer) => sum + customer.meters.length, 0);
  const customersWithoutMeter = customers.filter((customer) => customer.meters.length === 0).length;

  return (
    <AdminPageShell
      eyebrow="Customer Operations"
      title="Build and audit the active consumer registry from one operations view."
      description="Create customer records, inspect service addresses and contact details, and verify which accounts still need a linked water meter before downstream reading and billing work starts."
      actions={<AdminPageActions links={[{ href: "/admin/meters", label: "Meter module" }]} />}
      stats={[
        {
          label: "Accounts",
          value: customers.length.toString(),
          detail: "Registered residential customer records",
          accent: "teal",
        },
        {
          label: "Linked meters",
          value: linkedMeterCount.toString(),
          detail: "Meters already assigned to customer accounts",
          accent: "sky",
        },
        {
          label: "Needs setup",
          value: customersWithoutMeter.toString(),
          detail: "Accounts still waiting for a service meter",
          accent: "amber",
        },
      ]}
    >
      <section className="grid gap-6 xl:grid-cols-[minmax(0,26rem)_minmax(0,1fr)]">
        <CustomerForm />
        <CustomerList
          customers={filteredCustomers}
          totalCount={customers.length}
          query={query}
          status={status || "ALL"}
        />
      </section>
    </AdminPageShell>
  );
}

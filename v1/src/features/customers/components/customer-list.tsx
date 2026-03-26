import type { Customer, CustomerStatus, MeterStatus } from "@prisma/client";

import { RecordListSection } from "@/features/admin/components/record-list-section";
import { ResponsiveDataTable } from "@/features/admin/components/responsive-data-table";
import { StatusPill } from "@/features/admin/components/status-pill";

type CustomerListProps = {
  customers: (Pick<
    Customer,
    "id" | "accountNumber" | "name" | "address" | "contactNumber" | "email" | "createdAt"
  > & {
    status: CustomerStatus;
    meters: {
      id: string;
      meterNumber: string;
      status: MeterStatus;
      holderTransfers: {
        id: string;
        effectiveDate: Date;
      }[];
    }[];
  })[];
  totalCount: number;
  query: string;
  status: "ALL" | CustomerStatus;
};

export function CustomerList({ customers, totalCount, query, status }: CustomerListProps) {
  const hasActiveFilters = Boolean(query || status !== "ALL");
  const resultsText = hasActiveFilters
    ? `Showing ${customers.length} of ${totalCount} account${totalCount === 1 ? "" : "s"}`
    : `${customers.length} customer${customers.length === 1 ? "" : "s"} recorded`;

  return (
    <RecordListSection
      eyebrow="Customer Registry"
      title="Existing service accounts"
      description="Search by account number, customer name, address, contact, or email to find the next account that needs meter setup or status review."
      resultsText={resultsText}
      searchName="query"
      searchValue={query}
      searchPlaceholder="Search account, customer, address, or contact"
      filterName="status"
      filterValue={status}
      filterLabel="Customer status"
      filterOptions={[
        { label: "All statuses", value: "ALL" },
        { label: "Active", value: "ACTIVE" },
        { label: "Inactive", value: "INACTIVE" },
        { label: "Disconnected", value: "DISCONNECTED" },
      ]}
      helperText="Use this registry to confirm account details before assigning or transferring a meter."
      nextStep="Next: open Meters to attach service hardware after the account is saved."
      resetHref="/admin/customers"
      hasActiveFilters={hasActiveFilters}
    >
      <ResponsiveDataTable
        columns={["Account", "Name", "Address", "Contact", "Linked meter", "Status"]}
        colSpan={6}
        hasRows={customers.length > 0}
        emptyMessage={
          hasActiveFilters
            ? "No customer accounts match the current search or status filter."
            : "No customers yet. Create the first record with the form on this page."
        }
        mobileCards={customers.map((customer) => (
          <article key={customer.id} className="rounded-[1.35rem] border border-[#dbe9e5] bg-white p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-medium text-foreground">{customer.name}</p>
                <p className="mt-1 font-mono text-xs text-muted-foreground">
                  {customer.accountNumber}
                </p>
              </div>
              <StatusPill
                priority={
                  customer.status === "ACTIVE"
                    ? "success"
                    : customer.status === "DISCONNECTED"
                      ? "attention"
                      : "readonly"
                }
              >
                {customer.status.replace("_", " ")}
              </StatusPill>
            </div>

            <dl className="mt-4 grid gap-3 text-sm">
              <div>
                <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Address
                </dt>
                <dd className="mt-1 text-muted-foreground">{customer.address}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Contact
                </dt>
                <dd className="mt-1 text-muted-foreground">
                  <div>{customer.contactNumber || "No contact number"}</div>
                  <div className="mt-1 text-xs">{customer.email || "No email address"}</div>
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Linked meter
                </dt>
                <dd className="mt-2">
                  {customer.meters.length ? (
                    <div className="flex flex-wrap gap-2">
                      {customer.meters.map((meter) => (
                        <span
                          key={meter.id}
                          className="inline-flex rounded-full bg-secondary/70 px-3 py-1 text-xs font-medium text-foreground"
                        >
                          {meter.meterNumber}
                          {meter.holderTransfers[0]
                            ? ` - moved ${meter.holderTransfers[0].effectiveDate.toLocaleDateString()}`
                            : ""}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-muted-foreground">No meter assigned</span>
                  )}
                </dd>
              </div>
            </dl>

            <p className="mt-4 text-xs text-muted-foreground">
              Added {customer.createdAt.toLocaleDateString()}
            </p>
          </article>
        ))}
        rows={customers.map((customer) => (
          <tr key={customer.id} className="align-top text-sm">
            <td className="px-4 py-4 font-mono text-xs text-muted-foreground">
              {customer.accountNumber}
            </td>
            <td className="px-4 py-4">
              <div className="font-medium text-foreground">{customer.name}</div>
              <div className="mt-1 text-xs text-muted-foreground">
                Added {customer.createdAt.toLocaleDateString()}
              </div>
            </td>
            <td className="px-4 py-4 text-muted-foreground">{customer.address}</td>
            <td className="px-4 py-4 text-muted-foreground">
              <div>{customer.contactNumber || "No contact number"}</div>
              <div className="mt-1 text-xs text-muted-foreground">
                {customer.email || "No email address"}
              </div>
            </td>
            <td className="px-4 py-4">
              {customer.meters.length ? (
                <div className="flex flex-wrap gap-2">
                  {customer.meters.map((meter) => (
                    <span
                      key={meter.id}
                      className="inline-flex rounded-full bg-secondary/70 px-3 py-1 text-xs font-medium text-foreground"
                    >
                      {meter.meterNumber}
                      {meter.holderTransfers[0]
                        ? ` - moved ${meter.holderTransfers[0].effectiveDate.toLocaleDateString()}`
                        : ""}
                    </span>
                  ))}
                </div>
              ) : (
                <span className="text-muted-foreground">No meter assigned</span>
              )}
            </td>
            <td className="px-4 py-4">
              <StatusPill
                priority={
                  customer.status === "ACTIVE"
                    ? "success"
                    : customer.status === "DISCONNECTED"
                      ? "attention"
                      : "readonly"
                }
              >
                {customer.status.replace("_", " ")}
              </StatusPill>
            </td>
          </tr>
        ))}
      />
    </RecordListSection>
  );
}

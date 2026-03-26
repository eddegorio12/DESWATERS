import type { Customer, CustomerStatus, MeterStatus } from "@prisma/client";

import { RecordListSection } from "@/features/admin/components/record-list-section";
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
      <div className="overflow-hidden rounded-[1.5rem] border border-[#dbe9e5] shadow-[0_18px_40px_-38px_rgba(16,63,67,0.45)]">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-border text-left">
            <thead className="bg-secondary/55">
              <tr className="text-sm text-muted-foreground">
                <th className="px-4 py-3 font-medium">Account</th>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Address</th>
                <th className="px-4 py-3 font-medium">Contact</th>
                <th className="px-4 py-3 font-medium">Linked meter</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-background">
              {customers.length ? (
                customers.map((customer) => (
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
                        tone={
                          customer.status === "ACTIVE"
                            ? "success"
                            : customer.status === "DISCONNECTED"
                              ? "danger"
                              : "warning"
                        }
                      >
                        {customer.status.replace("_", " ")}
                      </StatusPill>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-10 text-center text-sm text-muted-foreground"
                  >
                    {hasActiveFilters
                      ? "No customer accounts match the current search or status filter."
                      : "No customers yet. Create the first record with the form on this page."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </RecordListSection>
  );
}

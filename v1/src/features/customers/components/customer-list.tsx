import type { Customer, CustomerStatus, MeterStatus } from "@prisma/client";

type CustomerListProps = {
  customers: (Pick<
    Customer,
    "id" | "accountNumber" | "name" | "address" | "contactNumber" | "createdAt"
  > & {
    status: CustomerStatus;
    meters: {
      id: string;
      meterNumber: string;
      status: MeterStatus;
    }[];
  })[];
};

export function CustomerList({ customers }: CustomerListProps) {
  return (
    <section className="rounded-[1.9rem] border border-[#dbe9e5] bg-white/92 p-6 shadow-[0_22px_72px_-48px_rgba(16,63,67,0.55)]">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-muted-foreground">
            Customer Registry
          </p>
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">
            Existing service accounts
          </h2>
        </div>
        <p className="text-sm text-muted-foreground">
          {customers.length} customer{customers.length === 1 ? "" : "s"} recorded
        </p>
      </div>

      <div className="mt-6 overflow-hidden rounded-[1.5rem] border border-[#dbe9e5] shadow-[0_18px_40px_-38px_rgba(16,63,67,0.45)]">
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
                      {customer.contactNumber || "No contact number"}
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
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">No meter assigned</span>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <span className="inline-flex rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">
                        {customer.status.replace("_", " ")}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-10 text-center text-sm text-muted-foreground"
                  >
                    No customers yet. Create the first record with the form on this page.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

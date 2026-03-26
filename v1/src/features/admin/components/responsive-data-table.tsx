import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type ResponsiveDataTableProps = {
  columns: string[];
  colSpan: number;
  hasRows: boolean;
  emptyMessage: string;
  rows: ReactNode;
  mobileCards: ReactNode;
  breakpoint?: "lg" | "xl";
  className?: string;
  mobileContainerClassName?: string;
  tableClassName?: string;
};

const breakpointClasses = {
  lg: {
    mobile: "lg:hidden",
    desktop: "hidden lg:block",
  },
  xl: {
    mobile: "xl:hidden",
    desktop: "hidden xl:block",
  },
} as const;

export function ResponsiveDataTable({
  columns,
  colSpan,
  hasRows,
  emptyMessage,
  rows,
  mobileCards,
  breakpoint = "lg",
  className,
  mobileContainerClassName,
  tableClassName,
}: ResponsiveDataTableProps) {
  const visibility = breakpointClasses[breakpoint];

  return (
    <div
      className={cn(
        "overflow-hidden rounded-[1.5rem] border border-[#dbe9e5] shadow-[0_18px_40px_-38px_rgba(16,63,67,0.45)]",
        className
      )}
    >
      <div
        className={cn(
          "space-y-3 bg-background p-3",
          visibility.mobile,
          mobileContainerClassName
        )}
      >
        {hasRows ? (
          mobileCards
        ) : (
          <div className="px-4 py-10 text-center text-sm text-muted-foreground">
            {emptyMessage}
          </div>
        )}
      </div>

      <div className={cn("overflow-x-auto", visibility.desktop)}>
        <table className={cn("min-w-full divide-y divide-border text-left", tableClassName)}>
          <thead className="bg-secondary/55">
            <tr className="text-sm text-muted-foreground">
              {columns.map((column) => (
                <th key={column} className="px-4 py-3 font-medium">
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border bg-background">
            {hasRows ? (
              rows
            ) : (
              <tr>
                <td
                  colSpan={colSpan}
                  className="px-4 py-10 text-center text-sm text-muted-foreground"
                >
                  {emptyMessage}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

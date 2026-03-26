"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { buttonVariants } from "@/components/ui/button-variants";
import {
  generatePrintableBillNotice,
  generatePrintableCustomerNotice,
} from "@/features/notices/actions";
import { cn } from "@/lib/utils";

type BaseProps = {
  label: string;
  variant?: "default" | "outline";
  size?: "default" | "sm" | "lg";
  className?: string;
};

type GenerateNoticeButtonProps =
  | (BaseProps & {
      template:
        | "BILLING_REMINDER"
        | "FOLLOW_UP_REMINDER"
        | "FINAL_NOTICE"
        | "DISCONNECTION";
      billId: string;
      customerId?: never;
    })
  | (BaseProps & {
      template: "REINSTATEMENT" | "SERVICE_INTERRUPTION";
      customerId: string;
      billId?: never;
    });

export function GenerateNoticeButton({
  label,
  template,
  billId,
  customerId,
  variant = "outline",
  size = "sm",
  className,
}: GenerateNoticeButtonProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex flex-col items-end gap-2">
      <button
        type="button"
        className={cn(buttonVariants({ variant, size, className }), className)}
        disabled={isPending}
        onClick={() => {
          setError(null);

          startTransition(async () => {
            try {
              let noticeId: string;

              if (billId) {
                noticeId = await generatePrintableBillNotice(billId, template);
              } else if (customerId) {
                noticeId = await generatePrintableCustomerNotice(customerId, template);
              } else {
                throw new Error("A bill or customer reference is required to generate a notice.");
              }

              router.push(`/admin/notices/${noticeId}`);
              router.refresh();
            } catch (actionError) {
              setError(
                actionError instanceof Error
                  ? actionError.message
                  : "The printable notice could not be generated."
              );
            }
          });
        }}
      >
        {isPending ? "Preparing notice..." : label}
      </button>
      {error ? <p className="max-w-56 text-right text-xs text-destructive">{error}</p> : null}
    </div>
  );
}

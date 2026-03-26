"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { recordBillReprint } from "@/features/billing/actions";

type TrackBillReprintButtonProps = {
  billId: string;
};

export function TrackBillReprintButton({ billId }: TrackBillReprintButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);

  return (
    <div className="flex flex-col items-end gap-2">
      <Button
        type="button"
        variant="outline"
        disabled={isPending}
        onClick={() =>
          startTransition(async () => {
            try {
              setServerError(null);
              await recordBillReprint(billId);
              router.refresh();
            } catch (error) {
              console.error(error);
              setServerError(
                error instanceof Error ? error.message : "The bill reprint could not be logged."
              );
            }
          })
        }
      >
        {isPending ? "Logging reprint..." : "Log reprint"}
      </Button>
      {serverError ? (
        <p className="max-w-48 text-right text-xs text-destructive">{serverError}</p>
      ) : null}
    </div>
  );
}

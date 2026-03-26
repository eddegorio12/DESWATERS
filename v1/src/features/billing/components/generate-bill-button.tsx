"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { generateBill } from "@/features/billing/actions";
import { cn } from "@/lib/utils";

type GenerateBillButtonProps = {
  readingId: string;
  className?: string;
};

export function GenerateBillButton({ readingId, className }: GenerateBillButtonProps) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleGenerateBill() {
    setServerError(null);

    startTransition(async () => {
      try {
        await generateBill(readingId);
        router.refresh();
      } catch (error) {
        console.error(error);
        setServerError(
          error instanceof Error ? error.message : "Bill could not be generated."
        );
      }
    });
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <Button
        type="button"
        size="sm"
        className={cn("rounded-xl px-3", className)}
        disabled={isPending}
        onClick={handleGenerateBill}
      >
        {isPending ? "Generating..." : "Generate bill"}
      </Button>
      {serverError ? <p className="text-right text-xs text-destructive">{serverError}</p> : null}
    </div>
  );
}

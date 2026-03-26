"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { approveReading } from "@/features/readings/actions";
import { cn } from "@/lib/utils";

type ApproveReadingButtonProps = {
  readingId: string;
  className?: string;
};

export function ApproveReadingButton({ readingId, className }: ApproveReadingButtonProps) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleApprove() {
    setServerError(null);

    startTransition(async () => {
      try {
        await approveReading(readingId);
        router.refresh();
      } catch (error) {
        console.error(error);
        setServerError(
          error instanceof Error ? error.message : "Reading could not be approved."
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
        onClick={handleApprove}
      >
        {isPending ? "Approving..." : "Approve"}
      </Button>
      {serverError ? <p className="text-right text-xs text-destructive">{serverError}</p> : null}
    </div>
  );
}

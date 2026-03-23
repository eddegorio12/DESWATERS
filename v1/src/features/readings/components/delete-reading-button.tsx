"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { deleteReading } from "@/features/readings/actions";

type DeleteReadingButtonProps = {
  readingId: string;
};

export function DeleteReadingButton({ readingId }: DeleteReadingButtonProps) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    const confirmed = window.confirm(
      "Delete this reading? Use this only for encoding mistakes before approval."
    );

    if (!confirmed) {
      return;
    }

    setServerError(null);

    startTransition(async () => {
      try {
        await deleteReading(readingId);
        router.refresh();
      } catch (error) {
        console.error(error);
        setServerError(
          error instanceof Error ? error.message : "Reading could not be deleted."
        );
      }
    });
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <Button
        type="button"
        variant="destructive"
        size="sm"
        className="rounded-xl px-3"
        disabled={isPending}
        onClick={handleDelete}
      >
        {isPending ? "Deleting..." : "Delete"}
      </Button>
      {serverError ? <p className="text-right text-xs text-destructive">{serverError}</p> : null}
    </div>
  );
}

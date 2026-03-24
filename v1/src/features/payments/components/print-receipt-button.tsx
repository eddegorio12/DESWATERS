"use client";

import { Button } from "@/components/ui/button";

export function PrintReceiptButton() {
  return (
    <Button
      type="button"
      size="lg"
      className="h-10 rounded-xl px-4"
      onClick={() => window.print()}
    >
      Print receipt
    </Button>
  );
}

"use client";

import { Button } from "@/components/ui/button";

export function PrintNoticeButton() {
  return (
    <Button
      type="button"
      size="lg"
      className="h-10 rounded-xl px-4"
      onClick={() => window.print()}
    >
      Print notice
    </Button>
  );
}

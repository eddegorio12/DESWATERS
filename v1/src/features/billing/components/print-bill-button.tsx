"use client";

import { useCallback } from "react";

import { Button } from "@/components/ui/button";

export function PrintBillButton() {
  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  return (
    <Button type="button" size="lg" className="h-10 rounded-xl px-4" onClick={handlePrint}>
      Print bill
    </Button>
  );
}

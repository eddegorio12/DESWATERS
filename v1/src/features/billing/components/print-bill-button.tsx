"use client";

import { useCallback } from "react";

import { Button } from "@/components/ui/button";

type PrintBillButtonProps = {
  label?: string;
};

export function PrintBillButton({ label = "Print bill" }: PrintBillButtonProps) {
  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  return (
    <Button type="button" size="lg" className="h-10 rounded-xl px-4" onClick={handlePrint}>
      {label}
    </Button>
  );
}

"use client";

import { startTransition, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type FirstLoginSyncProps = {
  needsSync: boolean;
  syncUser: () => Promise<{ localUserId: string; role: string; approvalStatus: string }>;
};

export function FirstLoginSync({
  needsSync,
  syncUser,
}: FirstLoginSyncProps) {
  const router = useRouter();
  const hasRunRef = useRef(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!needsSync || hasRunRef.current) {
      return;
    }

    hasRunRef.current = true;

    startTransition(async () => {
      try {
        await syncUser();
        router.refresh();
      } catch (syncError) {
        console.error(syncError);
        setError("We could not submit or link your DWDS staff access request automatically.");
      }
    });
  }, [needsSync, router, syncUser]);

  if (!error) {
    return null;
  }

  return (
    <p className="rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
      {error}
    </p>
  );
}

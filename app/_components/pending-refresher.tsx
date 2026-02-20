"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function PendingRefresher({ isPending }: { isPending: boolean }) {
  const router = useRouter();

  useEffect(() => {
    if (!isPending) return;

    const start = Date.now();
    const id = setInterval(() => {
      if (Date.now() - start >= 130_000) {
        clearInterval(id);
        return;
      }
      router.refresh();
    }, 2000);

    return () => clearInterval(id);
  }, [isPending, router]);

  if (!isPending) return null;

  return (
    <button
      onClick={() => router.refresh()}
      className="self-start text-sm text-gray-500 underline"
    >
      Refresh
    </button>
  );
}

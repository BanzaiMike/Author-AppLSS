"use client";

import { useState } from "react";
import Link from "next/link";

type Props = {
  eligible: boolean;
  blockedReason: "pending" | "active" | "terminal_ineligible" | null;
  blockedMessage: string | null;
  forceShowBlockedMessage: boolean;
};

export function DeleteAccountControl({
  eligible,
  blockedReason: _blockedReason,
  blockedMessage,
  forceShowBlockedMessage,
}: Props) {
  const [showMessage, setShowMessage] = useState(
    !eligible && forceShowBlockedMessage
  );

  if (eligible) {
    return (
      <Link
        href="/confirm-delete-account"
        className="rounded border border-red-600 px-4 py-2 text-red-600 hover:bg-red-50"
      >
        Delete Account
      </Link>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={() => setShowMessage(true)}
        className="rounded border border-red-600 px-4 py-2 text-red-600 hover:bg-red-50"
      >
        Delete Account
      </button>
      {showMessage && blockedMessage && (
        <p className="max-w-xs rounded bg-red-50 px-3 py-2 text-sm text-red-800">
          {blockedMessage}
        </p>
      )}
    </div>
  );
}

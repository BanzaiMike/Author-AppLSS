"use client";

import { useState } from "react";
import Link from "next/link";
import { deleteAccount } from "@/lib/auth/actions";

export function DeleteForm() {
  const [password, setPassword] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!confirmed) {
      setError("You must confirm account deletion.");
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.set("password", password);
    formData.set("confirmed", confirmed ? "true" : "false");

    const result = await deleteAccount(formData);
    setLoading(false);

    if (result?.error) {
      setError(result.error);
    }
    // If successful, the server action redirects — we won't reach here.
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4">
      <form
        onSubmit={handleSubmit}
        className="flex w-full max-w-sm flex-col gap-4"
      >
        <h1 className="text-2xl font-bold text-red-600">Delete Account</h1>

        <p className="text-sm">
          This action is <strong>permanent</strong> and cannot be undone. Your
          account and all associated data will be permanently deleted.
        </p>

        {error && (
          <p className="rounded bg-red-100 px-4 py-2 text-sm text-red-800">
            {error}
          </p>
        )}

        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">
            Enter your password to confirm
          </span>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="rounded border px-3 py-2"
          />
        </label>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={confirmed}
            onChange={(e) => setConfirmed(e.target.checked)}
          />
          Yes, Delete My Account
        </label>

        <button
          type="submit"
          disabled={loading || !confirmed}
          className="rounded bg-red-600 px-4 py-2 text-white hover:bg-red-700 disabled:opacity-50"
        >
          {loading ? "Deleting..." : "Delete My Account"}
        </button>

        <Link href="/account" className="text-center text-sm underline">
          Cancel
        </Link>
      </form>
    </main>
  );
}

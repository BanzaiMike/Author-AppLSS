"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/auth/browser";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const supabase = createClient();
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(
      email,
      { redirectTo: `${window.location.origin}/auth/callback?type=recovery` }
    );
    setLoading(false);

    if (resetError) {
      if (resetError.message.toLowerCase().includes("rate")) {
        setError("Too many requests. Please try again later.");
      } else {
        setError("Something went wrong. Please try again.");
      }
      return;
    }

    setSubmitted(true);
  }

  if (submitted) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-4">
        <div className="flex w-full max-w-sm flex-col gap-4">
          <h1 className="text-2xl font-bold">Check your email</h1>
          <p className="text-sm">
            If an account exists for this email, a reset link has been sent.
          </p>
          <Link href="/login" className="text-sm underline">
            Back to login
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4">
      <form
        onSubmit={handleSubmit}
        className="flex w-full max-w-sm flex-col gap-4"
      >
        <h1 className="text-2xl font-bold">Forgot password</h1>

        {error && (
          <p className="rounded bg-red-100 px-4 py-2 text-sm text-red-800">
            {error}
          </p>
        )}

        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">Email</span>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="rounded border px-3 py-2"
          />
        </label>

        <button
          type="submit"
          disabled={loading}
          className="rounded bg-foreground px-4 py-2 text-background hover:opacity-90 disabled:opacity-50"
        >
          {loading ? "Sending..." : "Send reset link"}
        </button>

        <Link href="/login" className="text-center text-sm underline">
          Back to login
        </Link>
      </form>
    </main>
  );
}

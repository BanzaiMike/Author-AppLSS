"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/auth/browser";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [hasSession, setHasSession] = useState<boolean | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      setHasSession(!!user);
    });
  }, []);

  if (hasSession === null) {
    return null;
  }

  if (hasSession === false) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-4">
        <div className="flex w-full max-w-sm flex-col gap-4">
          <h1 className="text-2xl font-bold">Invalid or expired reset link</h1>
          <p className="text-sm">
            Reset link has expired. Request a new one.
          </p>
          <a href="/forgot-password" className="text-sm underline">
            Request new reset link
          </a>
        </div>
      </main>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 12 || password.length > 72) {
      setError("Password must be between 12 and 72 characters.");
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({
      password,
    });

    if (updateError) {
      setLoading(false);
      setError("Something went wrong. Please try again.");
      return;
    }

    await supabase.auth.signOut();
    router.push("/login?message=Password+updated.+Please+log+in.");
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4">
      <form
        onSubmit={handleSubmit}
        className="flex w-full max-w-sm flex-col gap-4"
      >
        <h1 className="text-2xl font-bold">Set new password</h1>

        {error && (
          <p className="rounded bg-red-100 px-4 py-2 text-sm text-red-800">
            {error}
          </p>
        )}

        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">New password</span>
          <input
            type={showPassword ? "text" : "password"}
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="rounded border px-3 py-2"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">Confirm new password</span>
          <input
            type={showPassword ? "text" : "password"}
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="rounded border px-3 py-2"
          />
        </label>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={showPassword}
            onChange={(e) => setShowPassword(e.target.checked)}
          />
          Show passwords
        </label>

        <button
          type="submit"
          disabled={loading}
          className="rounded bg-foreground px-4 py-2 text-background hover:opacity-90 disabled:opacity-50"
        >
          {loading ? "Updating..." : "Update password"}
        </button>
      </form>
    </main>
  );
}

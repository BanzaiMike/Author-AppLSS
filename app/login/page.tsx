"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/auth/browser";
import SystemStatusAlert from "@/app/_components/SystemStatusAlert";

export default function LoginPage() {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setMessage(params.get("message") || "");
  }, []);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setLoading(false);

    if (signInError) {
      setError(signInError.message || "Invalid email or password.");
      return;
    }

    router.push("/app");
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-surface p-4 text-foreground">
      <div className="flex w-full max-w-sm flex-col gap-4">
        <SystemStatusAlert />
      <form
        onSubmit={handleSubmit}
        className="flex w-full max-w-sm flex-col gap-4 rounded-card border-2 border-card-border bg-background p-8 text-foreground shadow-card"
      >
        <h1 className="text-4xl font-bold">Log in</h1>

        {message && (
          <p className="rounded bg-blue-100 px-4 py-2 text-sm text-blue-800">
            {message}
          </p>
        )}

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
            className="rounded-input border border-card-border bg-background px-3 py-2 text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">Password</span>
          <input
            type={showPassword ? "text" : "password"}
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="rounded-input border border-card-border bg-background px-3 py-2 text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          />
        </label>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={showPassword}
            onChange={(e) => setShowPassword(e.target.checked)}
          />
          Show password
        </label>

        <button
          type="submit"
          disabled={loading}
          className="rounded-btn bg-accent px-4 py-2 text-white hover:opacity-90 disabled:opacity-50"
        >
          {loading ? "Logging in..." : "Log in"}
        </button>

        <div className="flex justify-between text-sm">
          <Link href="/forgot-password" className="text-accent underline">
            Forgot password?
          </Link>
          <Link href="/signup" className="text-accent underline">
            Create account
          </Link>
        </div>
      </form>
      </div>
    </main>
  );
}

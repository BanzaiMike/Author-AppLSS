"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/auth/browser";
import SystemStatusAlert from "@/app/_components/SystemStatusAlert";

export default function SignUpPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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
    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
    });
    setLoading(false);

    if (signUpError) {
      if (signUpError.message.toLowerCase().includes("already registered")) {
        setError(
          "An account with this email already exists. Please log in."
        );
      } else {
        setError("Something went wrong. Please try again.");
      }
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
        <h1 className="text-4xl font-bold">Create account</h1>

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

        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">Confirm password</span>
          <input
            type={showPassword ? "text" : "password"}
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="rounded-input border border-card-border bg-background px-3 py-2 text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
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
          className="rounded-btn bg-accent px-4 py-2 text-white hover:opacity-90 disabled:opacity-50"
        >
          {loading ? "Creating account..." : "Create account"}
        </button>

        <p className="text-center text-sm">
          Already have an account?{" "}
          <Link href="/login" className="text-accent underline">
            Log in
          </Link>
        </p>
      </form>
      </div>
    </main>
  );
}

import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import SystemStatusAlert from "@/app/_components/SystemStatusAlert";

const MIGVOX_URL =
  "https://migvox.com/migvox-home/current-experiment/migvox-for-authors/";

export default async function StartPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>;
}) {
  const user = await getCurrentUser();
  if (user) {
    redirect("/app");
  }

  const { message } = await searchParams;

  return (
    <div className="min-h-screen bg-surface text-foreground flex flex-col">

      {/* Nav */}
      <nav className="w-full bg-black">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-6 py-4">
          <Link href="/" className="flex shrink-0 items-center gap-3">
            <Image
              src="/MigVoxForWriters-Logo1.png"
              alt="MigVox for Authors logo"
              width={28}
              height={28}
            />
            <span className="font-heading text-sm font-bold text-accent">
              MigVox for Authors
            </span>
          </Link>
          <a
            href={MIGVOX_URL}
            className="font-sans text-sm text-muted-foreground hover:underline"
          >
            Back to MigVox.com
          </a>
          <div className="flex shrink-0 items-center gap-4">
            <Link
              href="/login"
              className="font-sans text-sm text-white hover:text-accent"
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className="rounded border border-accent px-3 py-1 font-sans text-sm text-accent hover:bg-accent/10"
            >
              Sign up
            </Link>
          </div>
        </div>
      </nav>

      {/* System status alert */}
      <div className="w-full px-6 pt-2">
        <div className="mx-auto max-w-3xl">
          <SystemStatusAlert />
        </div>
      </div>

      {/* Account-deleted banner */}
      {message === "account-deleted" && (
        <div className="w-full bg-green-100 px-6 py-2 text-center">
          <p className="font-sans text-sm text-green-800">
            Your account has been deleted.
          </p>
        </div>
      )}

      {/* Core content */}
      <main className="flex flex-1 items-center justify-center px-6 py-20">
        <div className="w-full max-w-3xl flex flex-col gap-8">

          {/* Headline block */}
          <div className="flex flex-col gap-3">
            <h1 className="font-heading text-3xl font-bold text-foreground">
              MigVox for Authors
            </h1>
            <p className="font-sans text-base font-medium text-muted-foreground">
              Partner Portal for AI-Assisted Authorship
            </p>
            <p className="font-sans text-sm text-muted-foreground max-w-xl">
              This application supports a controlled pilot for professional
              authors and their publishers. The goal is to establish a
              defensible model of authorship when an AI is involved.
            </p>
          </div>

          {/* Status panel */}
          <div className="rounded-xl border border-border bg-background p-6 flex flex-col gap-3">
            <p className="font-sans text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Current Project Status
            </p>
            <p className="font-sans text-sm text-muted-foreground">
              The pilot has not yet begun.
            </p>
            <p className="font-sans text-sm font-semibold text-foreground">
              Currently recruiting five professional authors and their
              publishers.
            </p>
            <p className="font-sans text-sm text-muted-foreground">
              The EULA will be co-authored with selected partners before launch.
            </p>
          </div>

          {/* Access actions */}
          <div className="flex flex-col items-center gap-4">
            <div className="flex items-center gap-4">
              <Link
                href="/signup"
                className="rounded-btn bg-accent px-6 py-2.5 font-sans text-sm font-semibold text-white hover:opacity-90"
              >
                Sign up
              </Link>
              <Link
                href="/login"
                className="font-sans text-sm text-foreground hover:text-accent"
              >
                Log in
              </Link>
            </div>
            <p className="font-sans text-xs text-muted-foreground">
              Partner enrollment is reviewed prior to pilot activation.
            </p>
          </div>

          {/* Bottom reinforcement link */}
          <div className="border-t border-border pt-6">
            <a
              href={MIGVOX_URL}
              className="font-sans text-xs text-muted-foreground hover:underline"
            >
              Back to the MigVox experiment overview →
            </a>
          </div>

        </div>
      </main>

    </div>
  );
}

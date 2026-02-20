import Image from "next/image";
import Link from "next/link";
import { getCurrentUser, logout } from "@/lib/auth";
import SystemStatusAlert from "@/app/_components/SystemStatusAlert";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  return (
    <div className="flex min-h-screen flex-col">
      {/* Top Bar */}
      <header className="w-full bg-black">
        <div className="mx-auto flex max-w-container items-center justify-between px-6 py-4">
          <Link href="/app" className="flex items-center gap-3">
            <Image
              src="/MigVoxForWriters-Logo1.png"
              alt="MigVox for Writers"
              width={36}
              height={36}
            />
            <span className="font-heading text-lg font-bold text-accent">
              MigVox for Authors
            </span>
          </Link>
          <nav className="flex items-center gap-6">
            <a
              href="https://migvox.com/migvox-home/contact/"
              target="_blank"
              rel="noopener noreferrer"
              className="font-sans text-sm text-white hover:text-accent"
            >
              Contact
            </a>
            {user ? (
              <>
                <Link
                  href="/app/account"
                  className="font-sans text-sm text-white hover:text-accent"
                >
                  Account
                </Link>
                <form action={logout}>
                  <button
                    type="submit"
                    className="cursor-pointer border-0 bg-transparent p-0 font-sans text-sm text-white hover:text-accent"
                  >
                    Logout
                  </button>
                </form>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="font-sans text-sm text-white hover:text-accent"
                >
                  Login
                </Link>
                <Link
                  href="/signup"
                  className="font-sans text-sm text-white hover:text-accent"
                >
                  Sign up
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 bg-surface text-foreground">
        <div className="mx-auto max-w-container px-6 pt-3">
          <SystemStatusAlert />
        </div>
        {children}
      </div>

      {/* Footer */}
      <footer className="w-full bg-black">
        <div className="mx-auto flex max-w-container items-center justify-between px-6 py-6">
          <p className="font-sans text-sm leading-relaxed text-white/80">
            © 2026 ProximaFlux LLC
          </p>
          <a
            href="https://www.migvox.com"
            target="_blank"
            rel="noopener noreferrer"
            className="font-sans text-sm text-white/80 hover:text-accent"
          >
            MigVox.com
          </a>
        </div>
      </footer>
    </div>
  );
}

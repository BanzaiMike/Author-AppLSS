import Image from "next/image";
import { requireUser, logout } from "@/lib/auth";
import { getEntitlement } from "@/lib/billing/entitlements";
import { createClient } from "@/lib/auth/server";
import { PendingRefresher } from "@/app/_components/pending-refresher";
import { DeleteAccountControl } from "@/app/_components/delete-account-control";

const UI_NON_ACTIVE_STATES = ["canceled", "incomplete_expired", "paused"];

type Props = {
  messageParam?: string | null;
  deleteParam?: string | null;
};

export async function AccountUI({ messageParam, deleteParam }: Props) {
  const user = await requireUser();
  const supabase = await createClient();

  const [entitlement, { data: billingCustomer }] = await Promise.all([
    getEntitlement(user.id),
    supabase
      .from("billing_customers")
      .select("stripe_customer_id")
      .eq("user_id", user.id)
      .maybeSingle(),
  ]);

  // Subscription UI — evaluated in priority order: 1 → 4 → 2 → 3
  const isActive = entitlement?.stripe_status === "active";
  const isAmbiguous =
    !!entitlement &&
    !isActive &&
    !UI_NON_ACTIVE_STATES.includes(entitlement.stripe_status);
  const isPending =
    !!billingCustomer &&
    (!entitlement || entitlement.stripe_status !== "active");

  // Canonical Deletion Eligibility Rules
  const SAFE_TERMINAL_STATES = ["canceled", "incomplete_expired"];
  let deleteEligible = false;
  let deleteBlockedReason: "pending" | "active" | "terminal_ineligible" | null = null;
  let deleteBlockedMessage: string | null = null;

  if (!billingCustomer && !entitlement) {
    // Case A: No billing state
    deleteEligible = true;
  } else if (billingCustomer && !entitlement) {
    // Case B: Pending billing state
    deleteBlockedReason = "pending";
    deleteBlockedMessage =
      "Apologies, your subscription activation is still processing. Please wait a moment and refresh the page before attempting to delete your account.";
  } else if (entitlement) {
    // Case C: Entitlement exists
    if (SAFE_TERMINAL_STATES.includes(entitlement.stripe_status)) {
      deleteEligible = true;
    } else if (entitlement.stripe_status === "active") {
      deleteBlockedReason = "active";
      deleteBlockedMessage =
        "Apologies, you cannot delete an account with an active subscription. Please click 'Manage Subscription' and use the Stripe customer dashboard to cancel your subscription first.";
    } else {
      deleteBlockedReason = "terminal_ineligible";
      deleteBlockedMessage =
        "Apologies, your subscription is in a non-terminal state. Please contact customer support before attempting to delete your account.";
    }
  } else {
    // Case D: Defensive fallback
    deleteBlockedReason = "terminal_ineligible";
    deleteBlockedMessage =
      "Apologies, your subscription is in a non-terminal state. Please contact customer support before attempting to delete your account.";
  }

  const forceShowBlockedMessage = deleteParam === "blocked" && !deleteEligible;

  return (
    <main className="flex flex-col items-center gap-6 px-4 py-12 text-foreground">
      {/* Primary card: logo + page title */}
      <div className="flex w-full max-w-sm flex-col items-center gap-6 rounded-card border-[5px] border-card-border bg-background p-8 text-foreground shadow-card">
        <Image
          src="/MigVoxForWriters-Logo1.png"
          alt="MigVox for Writers"
          width={96}
          height={96}
        />
        <h1 className="text-4xl font-bold">Account</h1>
      </div>

      {messageParam && (
        <p className="rounded-input bg-blue-100 px-4 py-2 text-sm text-blue-800">
          {messageParam === "checkout-success"
            ? isActive
              ? "Subscription is now active."
              : "Subscription started. Your access will activate shortly."
            : messageParam === "checkout-canceled"
              ? "Checkout canceled."
              : messageParam}
        </p>
      )}

      <div className="flex w-full max-w-sm flex-col gap-2 rounded-card border-2 border-card-border bg-background p-4 text-foreground shadow-card">
        <p className="text-sm">
          <span className="font-medium">Email:</span> {user.email}
        </p>
        <p className="text-sm">
          <span className="font-medium">User ID:</span> {user.id}
        </p>
      </div>

      <div className="flex w-full max-w-sm flex-col gap-3 rounded-card border-2 border-card-border bg-background p-4 text-foreground shadow-card">
        <p className="text-sm font-medium">Subscription</p>

        {isActive ? (
          // Case 1: Active
          <>
            <p className="text-sm">
              Status:{" "}
              <span className="font-medium text-green-700">active</span>
            </p>
            {entitlement?.current_period_end && (
              <p className="text-sm text-gray-500">
                Renews:{" "}
                {new Date(entitlement.current_period_end).toLocaleDateString()}
              </p>
            )}
            <form method="POST" action="/api/stripe/portal">
              <button
                type="submit"
                className="rounded-btn bg-accent px-4 py-2 text-sm text-white hover:opacity-90"
              >
                Manage Subscription
              </button>
            </form>
          </>
        ) : isAmbiguous ? (
          // Case 4: Ambiguous / Needs Attention
          <>
            <p className="text-sm">
              Status:{" "}
              <span className="text-gray-500">{entitlement!.stripe_status}</span>
            </p>
            <p className="rounded-input bg-amber-50 px-3 py-2 text-sm text-amber-800">
              Your subscription is in an unexpected state. Please manage it via
              the portal or contact support.
            </p>
            <form method="POST" action="/api/stripe/portal">
              <button
                type="submit"
                className="rounded-btn bg-accent px-4 py-2 text-sm text-white hover:opacity-90"
              >
                Manage Subscription
              </button>
            </form>
          </>
        ) : isPending ? (
          // Case 2: Pending Activation
          <>
            <p className="text-sm">
              Status:{" "}
              <span className="font-medium text-yellow-600">
                Pending activation
                <span className="ml-0.5 inline-flex">
                  <span className="animate-bounce" style={{ animationDelay: "0ms" }}>.</span>
                  <span className="animate-bounce" style={{ animationDelay: "150ms" }}>.</span>
                  <span className="animate-bounce" style={{ animationDelay: "300ms" }}>.</span>
                </span>
              </span>
            </p>
            <PendingRefresher isPending />
            <form method="POST" action="/api/stripe/portal">
              <button
                type="submit"
                className="rounded-btn bg-accent px-4 py-2 text-sm text-white hover:opacity-90"
              >
                Manage Subscription
              </button>
            </form>
          </>
        ) : (
          // Case 3: Not Subscribed
          <>
            <p className="text-sm">
              Status: <span className="text-gray-500">none</span>
            </p>
            <form method="POST" action="/api/stripe/checkout">
              <button
                type="submit"
                className="rounded-btn bg-accent px-4 py-2 text-sm text-white hover:opacity-90"
              >
                Subscribe
              </button>
            </form>
          </>
        )}
      </div>

      <div className="flex items-start gap-4">
        <form action={logout}>
          <button
            type="submit"
            className="rounded-btn bg-foreground px-4 py-2 text-background hover:opacity-90"
          >
            Log out
          </button>
        </form>

        <DeleteAccountControl
          eligible={deleteEligible}
          blockedReason={deleteBlockedReason}
          blockedMessage={deleteBlockedMessage}
          forceShowBlockedMessage={forceShowBlockedMessage}
        />
      </div>
    </main>
  );
}

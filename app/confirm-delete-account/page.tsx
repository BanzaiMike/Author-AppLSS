import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/auth/server";
import { DeleteForm } from "./delete-form";

const SAFE_TERMINAL_STATES = ["canceled", "incomplete_expired"];

export default async function ConfirmDeleteAccountPage() {
  const user = await requireUser();
  const supabase = await createClient();

  const [{ data: entitlement }, { data: billingCustomer }] = await Promise.all([
    supabase
      .from("entitlements")
      .select("stripe_status")
      .eq("user_id", user.id)
      .maybeSingle(),
    supabase
      .from("billing_customers")
      .select("user_id")
      .eq("user_id", user.id)
      .maybeSingle(),
  ]);

  // Canonical Deletion Eligibility Rules
  let eligible = false;

  if (!billingCustomer && !entitlement) {
    // Case A: No billing state
    eligible = true;
  } else if (billingCustomer && !entitlement) {
    // Case B: Pending billing state
    eligible = false;
  } else if (entitlement) {
    // Case C: Entitlement exists
    eligible = SAFE_TERMINAL_STATES.includes(entitlement.stripe_status);
  }
  // Case D: Defensive fallback — eligible remains false

  if (!eligible) {
    redirect("/app/account?delete=blocked");
  }

  return <DeleteForm />;
}

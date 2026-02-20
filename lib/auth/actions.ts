"use server";

import { redirect } from "next/navigation";
import { createClient } from "./server";
import { createAdminClient } from "./admin";

export async function deleteAccount(formData: FormData) {
  const password = formData.get("password") as string;
  const confirmed = formData.get("confirmed") as string;

  if (confirmed !== "true") {
    return { error: "You must confirm account deletion." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !user.email) {
    redirect("/login");
  }

  // Verify password by attempting sign-in
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password,
  });

  if (signInError) {
    return { error: "Invalid password." };
  }

  // Canonical Deletion Eligibility Rules
  const SAFE_TERMINAL_STATES = ["canceled", "incomplete_expired"];

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

  if (!billingCustomer && !entitlement) {
    // Case A: No billing state — proceed
  } else if (billingCustomer && !entitlement) {
    // Case B: Pending billing state
    return {
      error:
        "Apologies, your subscription activation is still processing. Please wait a moment and refresh the page before attempting to delete your account.",
    };
  } else if (entitlement) {
    // Case C: Entitlement exists
    if (!SAFE_TERMINAL_STATES.includes(entitlement.stripe_status)) {
      if (entitlement.stripe_status === "active") {
        return {
          error:
            "Apologies, you cannot delete an account with an active subscription. Please click 'Manage Subscription' and use the Stripe customer dashboard to cancel your subscription first.",
        };
      } else {
        return {
          error:
            "Apologies, your subscription is in a non-terminal state. Please contact customer support before attempting to delete your account.",
        };
      }
    }
    // Safe terminal state — proceed
  } else {
    // Case D: Defensive fallback
    return {
      error:
        "Apologies, your subscription is in a non-terminal state. Please contact customer support before attempting to delete your account.",
    };
  }

  // Delete user via admin API
  const admin = createAdminClient();
  const { error: deleteError } = await admin.auth.admin.deleteUser(user.id);

  if (deleteError) {
    return { error: "Something went wrong. Please try again." };
  }

  // Sign out current session
  await supabase.auth.signOut();

  redirect("/?message=account-deleted");
}

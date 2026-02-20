import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/auth/server";
import { stripe, stripeConfig } from "@/lib/billing/stripe";

export async function POST() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await createClient();

  // Block if subscription is already active
  const { data: entitlement } = await supabase
    .from("entitlements")
    .select("stripe_status")
    .eq("user_id", user.id)
    .maybeSingle();

  if (entitlement?.stripe_status === "active") {
    return NextResponse.redirect(stripeConfig.portalReturnUrl, 303);
  }

  // Check for an existing Stripe customer to reuse on resubscription.
  // Uses the user's session (anon key + RLS) — no service role needed here.
  const { data: existingCustomer } = await supabase
    .from("billing_customers")
    .select("stripe_customer_id")
    .eq("user_id", user.id)
    .maybeSingle();

  const sessionParams: Parameters<typeof stripe.checkout.sessions.create>[0] =
    {
      mode: "subscription",
      line_items: [{ price: stripeConfig.priceId, quantity: 1 }],
      client_reference_id: user.id,
      metadata: { user_id: user.id },
      success_url: stripeConfig.successUrl,
      cancel_url: stripeConfig.cancelUrl,
    };

  if (existingCustomer?.stripe_customer_id) {
    sessionParams.customer = existingCustomer.stripe_customer_id;
  } else {
    sessionParams.customer_email = user.email ?? undefined;
  }

  const session = await stripe.checkout.sessions.create(sessionParams);

  return NextResponse.redirect(session.url!, 303);
}

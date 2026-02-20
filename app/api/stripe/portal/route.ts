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
  const { data: customer } = await supabase
    .from("billing_customers")
    .select("stripe_customer_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!customer?.stripe_customer_id) {
    return NextResponse.redirect(stripeConfig.portalReturnUrl, 303);
  }

  const portalSession = await stripe.billingPortal.sessions.create({
    customer: customer.stripe_customer_id,
    return_url: stripeConfig.portalReturnUrl,
  });

  return NextResponse.redirect(portalSession.url, 303);
}

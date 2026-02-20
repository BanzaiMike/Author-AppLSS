import Stripe from "stripe";
import { createAdminClient } from "@/lib/auth/admin";
import { stripe } from "@/lib/billing/stripe";

type AdminClient = ReturnType<typeof createAdminClient>;

export async function handleWebhookEvent(event: Stripe.Event): Promise<void> {
  const supabase = createAdminClient();

  // Insert the event to deduplicate via primary key constraint.
  // If already processed, the insert will fail with a unique violation (code 23505).
  const { error: insertError } = await supabase
    .from("stripe_events")
    .insert({ event_id: event.id, event_type: event.type });

  if (insertError) {
    if (insertError.code === "23505") {
      console.log(`[webhook] Already processed: ${event.id}`);
      return;
    }
    throw insertError;
  }

  switch (event.type) {
    case "checkout.session.completed":
      await handleCheckoutCompleted(
        supabase,
        event.data.object as Stripe.Checkout.Session
      );
      break;
    case "customer.subscription.created":
    case "customer.subscription.updated":
      await handleSubscriptionUpsert(
        supabase,
        event.data.object as Stripe.Subscription
      );
      break;
    case "customer.subscription.deleted":
      await handleSubscriptionDeleted(
        supabase,
        event.data.object as Stripe.Subscription
      );
      break;
  }
}

async function handleCheckoutCompleted(
  supabase: AdminClient,
  session: Stripe.Checkout.Session
): Promise<void> {
  const userId =
    session.client_reference_id ?? session.metadata?.user_id ?? null;

  if (!userId) {
    console.log(
      `[webhook] checkout.session.completed: cannot determine user_id. session=${session.id}`
    );
    return;
  }

  const customerId =
    typeof session.customer === "string"
      ? session.customer
      : (session.customer?.id ?? null);

  if (!customerId) {
    console.log(
      `[webhook] checkout.session.completed: cannot determine customer_id. session=${session.id}`
    );
    return;
  }

  const { error: bcError } = await supabase
    .from("billing_customers")
    .upsert(
      { user_id: userId, stripe_customer_id: customerId },
      { onConflict: "user_id" }
    );

  if (bcError) {
    console.error(
      `[webhook] Failed to upsert billing_customers user=${userId}:`,
      bcError.message
    );
    throw bcError;
  }

  console.log(
    `[webhook] billing_customers mapped: user=${userId} customer=${customerId}`
  );

  const subscriptionId =
    typeof session.subscription === "string"
      ? session.subscription
      : (session.subscription?.id ?? null);

  if (!subscriptionId) {
    console.log(
      `[webhook] checkout.session.completed missing subscription_id; entitlements not set. session=${session.id}`
    );
    return;
  }

  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const periodEnd = (subscription as any).current_period_end as number | undefined;
  const currentPeriodEnd = periodEnd ? new Date(periodEnd * 1000).toISOString() : null;

  const { error: entError } = await supabase.from("entitlements").upsert(
    {
      user_id: userId,
      stripe_subscription_id: subscription.id,
      stripe_status: subscription.status,
      current_period_end: currentPeriodEnd,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  );

  if (entError) {
    console.error(
      `[webhook] Failed to upsert entitlements user=${userId}:`,
      entError.message
    );
    throw entError;
  }

  console.log(
    `[webhook] entitlements upserted: user=${userId} status=${subscription.status}`
  );
}

async function handleSubscriptionUpsert(
  supabase: AdminClient,
  subscription: Stripe.Subscription
): Promise<void> {
  const customerId =
    typeof subscription.customer === "string"
      ? subscription.customer
      : subscription.customer.id;

  const { data: customer } = await supabase
    .from("billing_customers")
    .select("user_id")
    .eq("stripe_customer_id", customerId)
    .maybeSingle();

  if (!customer) {
    console.log(
      `[webhook] Cannot map customer ${customerId} to user — skipping entitlement update`
    );
    return;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const periodEnd = (subscription as any).current_period_end as number | undefined;
  const currentPeriodEnd = periodEnd ? new Date(periodEnd * 1000).toISOString() : null;

  const { error } = await supabase.from("entitlements").upsert(
    {
      user_id: customer.user_id,
      stripe_subscription_id: subscription.id,
      stripe_status: subscription.status,
      current_period_end: currentPeriodEnd,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  );

  if (error) {
    console.error(
      `[webhook] Failed to upsert entitlements user=${customer.user_id}:`,
      error.message
    );
    throw error;
  }

  console.log(
    `[webhook] entitlements upserted: user=${customer.user_id} status=${subscription.status}`
  );
}

async function handleSubscriptionDeleted(
  supabase: AdminClient,
  subscription: Stripe.Subscription
): Promise<void> {
  const customerId =
    typeof subscription.customer === "string"
      ? subscription.customer
      : subscription.customer.id;

  const { data: customer } = await supabase
    .from("billing_customers")
    .select("user_id")
    .eq("stripe_customer_id", customerId)
    .maybeSingle();

  if (!customer) {
    console.log(
      `[webhook] Cannot map customer ${customerId} to user — skipping entitlement update`
    );
    return;
  }

  const { error } = await supabase
    .from("entitlements")
    .update({
      stripe_status: subscription.status,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", customer.user_id);

  if (error) {
    console.error(
      `[webhook] Failed to update entitlements user=${customer.user_id}:`,
      error.message
    );
    throw error;
  }

  console.log(
    `[webhook] entitlements updated: user=${customer.user_id} status=${subscription.status}`
  );
}

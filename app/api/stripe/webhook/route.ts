import { NextResponse } from "next/server";
import { stripe, stripeConfig } from "@/lib/billing/stripe";
import { handleWebhookEvent } from "@/lib/billing/webhook";

export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get("Stripe-Signature");

  if (!signature) {
    console.error("[webhook] Missing Stripe-Signature header");
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      stripeConfig.webhookSecret
    );
  } catch (err) {
    console.error(
      "[webhook] Signature verification failed:",
      err instanceof Error ? err.message : String(err)
    );
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  console.log(`[webhook] Received: ${event.type} (${event.id})`);

  try {
    await handleWebhookEvent(event);
    console.log(`[webhook] Processed: ${event.type} (${event.id})`);
  } catch (err) {
    console.error(
      `[webhook] Internal error processing ${event.type} (${event.id}):`,
      err instanceof Error ? err.message : String(err)
    );
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

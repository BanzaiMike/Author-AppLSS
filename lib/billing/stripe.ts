import Stripe from "stripe";

const mode = process.env.STRIPE_MODE;

if (mode !== "sandbox" && mode !== "live") {
  throw new Error(
    `STRIPE_MODE must be "sandbox" or "live", got: "${mode}"`
  );
}

const secretKey =
  mode === "sandbox"
    ? process.env.STRIPE_SANDBOX_SECRET_KEY!
    : process.env.STRIPE_LIVE_SECRET_KEY!;

export const stripe = new Stripe(secretKey);

const baseUrl =
  mode === "sandbox"
    ? (process.env.APP_BASE_URL ?? "http://localhost:3000")
    : process.env.APP_BASE_URL!;

export const stripeConfig = {
  mode,
  priceId:
    mode === "sandbox"
      ? process.env.STRIPE_SANDBOX_PRICE_ID!
      : process.env.STRIPE_LIVE_PRICE_ID!,
  webhookSecret:
    mode === "sandbox"
      ? process.env.STRIPE_SANDBOX_WEBHOOK_SECRET!
      : process.env.STRIPE_LIVE_WEBHOOK_SECRET!,
  successUrl: `${baseUrl}/app/account?message=checkout-success`,
  cancelUrl: `${baseUrl}/app/account?message=checkout-canceled`,
  portalReturnUrl: `${baseUrl}/app/account`,
};

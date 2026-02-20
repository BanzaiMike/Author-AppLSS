import { createClient } from "@/lib/auth/server";

export async function getEntitlement(userId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("entitlements")
    .select("stripe_status, current_period_end, stripe_subscription_id")
    .eq("user_id", userId)
    .maybeSingle();
  return data;
}


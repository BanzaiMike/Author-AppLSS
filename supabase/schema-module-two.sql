-- Module Two: Stripe Integration — run this in the Supabase SQL editor

-- billing_customers
create table public.billing_customers (
  user_id          uuid        primary key references auth.users(id) on delete cascade,
  stripe_customer_id text      not null unique,
  created_at       timestamptz not null default now()
);

-- entitlements
create table public.entitlements (
  user_id                uuid        primary key references auth.users(id) on delete cascade,
  stripe_subscription_id text        not null unique,
  stripe_status          text        not null,
  current_period_end     timestamptz null,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);

-- stripe_events (idempotency log)
create table public.stripe_events (
  event_id   text        primary key,
  event_type text        not null,
  created_at timestamptz not null default now()
);

-- Indexes
create index on public.entitlements (stripe_status);
create index on public.billing_customers (stripe_customer_id);

-- Row Level Security
alter table public.billing_customers enable row level security;
alter table public.entitlements      enable row level security;
alter table public.stripe_events     enable row level security;

-- Users may read only their own rows; all writes go through the service role (bypasses RLS)
create policy "Users read own billing_customers"
  on public.billing_customers for select
  using (auth.uid() = user_id);

create policy "Users read own entitlements"
  on public.entitlements for select
  using (auth.uid() = user_id);

-- stripe_events: no user access (service role only)

-- Fase 3: columnas Stripe en profiles + tabla de idempotencia de webhooks

alter table public.profiles
  add column if not exists stripe_customer_id       text unique,
  add column if not exists stripe_subscription_id   text unique,
  add column if not exists stripe_price_id          text,
  add column if not exists subscription_status      text,
  add column if not exists subscription_period_end  timestamptz,
  add column if not exists cancel_at_period_end     boolean default false;

-- Búsqueda rápida por customer_id en el webhook
create index if not exists profiles_stripe_customer_idx
  on public.profiles (stripe_customer_id);

-- Registro de eventos procesados — garantiza idempotencia del webhook
-- Stripe puede reintentar el mismo evento varias veces; insertamos el id antes
-- de procesar y descartamos si ya existía (ON CONFLICT DO NOTHING).
create table if not exists public.stripe_events (
  id            text primary key,   -- event.id de Stripe (evt_...)
  type          text not null,
  processed_at  timestamptz default now()
);

alter table public.stripe_events enable row level security;
-- Sin políticas RLS: solo escribe el service_role (bypass RLS)

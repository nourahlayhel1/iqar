create table if not exists public.properties (
  id uuid primary key,
  payload jsonb not null
);

create table if not exists public.customers (
  id uuid primary key,
  payload jsonb not null
);

create table if not exists public.owners (
  id uuid primary key,
  payload jsonb not null
);

create table if not exists public.requests (
  id uuid primary key,
  payload jsonb not null
);

alter table public.properties disable row level security;
alter table public.customers disable row level security;
alter table public.owners disable row level security;
alter table public.requests disable row level security;

alter table public.properties add column if not exists property_number bigint;
alter table public.properties add column if not exists lot_number bigint;

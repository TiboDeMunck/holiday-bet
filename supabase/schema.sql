create extension if not exists pgcrypto;

create table if not exists public.games (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  status text not null default 'open'
    check (status in ('open', 'closed', 'revealed')),
  winning_destination_id uuid null,
  created_at timestamptz not null default now()
);

create table if not exists public.participants (
  id uuid primary key default gen_random_uuid(),
  browser_id uuid not null unique,
  name text not null check (char_length(name) between 2 and 40),
  created_at timestamptz not null default now()
);

create table if not exists public.destinations (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 60),
  normalized_name text not null unique,
  created_by uuid references public.participants(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.games
  drop constraint if exists games_winning_destination_id_fkey;

alter table public.games
  add constraint games_winning_destination_id_fkey
  foreign key (winning_destination_id)
  references public.destinations(id)
  on delete set null;

create table if not exists public.bets (
  id uuid primary key default gen_random_uuid(),
  participant_id uuid not null references public.participants(id) on delete cascade,
  destination_id uuid not null references public.destinations(id) on delete cascade,
  amount integer not null check (amount between 1 and 20),
  created_at timestamptz not null default now(),
  unique (participant_id, destination_id)
);

create or replace view public.destination_totals as
select
  d.id,
  d.name,
  coalesce(sum(b.amount), 0)::integer as total_stake
from public.destinations d
left join public.bets b on b.destination_id = d.id
group by d.id, d.name;

insert into public.games (slug)
values ('holiday')
on conflict (slug) do nothing;

alter table public.games enable row level security;
alter table public.participants enable row level security;
alter table public.destinations enable row level security;
alter table public.bets enable row level security;

revoke all on public.games from anon, authenticated;
revoke all on public.participants from anon, authenticated;
revoke all on public.destinations from anon, authenticated;
revoke all on public.bets from anon, authenticated;
revoke all on public.destination_totals from anon, authenticated;

-- Migration for finalized submissions and IP logging.
alter table public.participants
  add column if not exists ip_address text null,
  add column if not exists last_seen_at timestamptz null,
  add column if not exists finalized_at timestamptz null;

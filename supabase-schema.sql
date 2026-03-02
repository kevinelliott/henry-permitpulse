-- Enable auth
create table if not exists public.businesses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  industry text,
  state_code text,
  created_at timestamptz default now()
);

create table if not exists public.permit_categories (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references public.businesses(id) on delete cascade not null,
  name text not null,
  description text,
  created_at timestamptz default now()
);

create table if not exists public.permits (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references public.businesses(id) on delete cascade not null,
  category_id uuid references public.permit_categories(id) on delete set null,
  name text not null,
  permit_number text,
  issuing_authority text,
  issue_date date,
  expiration_date date,
  renewal_cost numeric(10,2),
  status text default 'active' check (status in ('active','expired','pending','revoked')),
  notes text,
  reminder_days integer[] default '{90,60,30,7}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.renewal_history (
  id uuid primary key default gen_random_uuid(),
  permit_id uuid references public.permits(id) on delete cascade not null,
  renewed_at date not null,
  cost numeric(10,2),
  was_on_time boolean default true,
  notes text,
  created_at timestamptz default now()
);

-- RLS
alter table public.businesses enable row level security;
alter table public.permit_categories enable row level security;
alter table public.permits enable row level security;
alter table public.renewal_history enable row level security;

create policy "Users manage own businesses" on public.businesses for all using (auth.uid() = user_id);
create policy "Users manage own categories" on public.permit_categories for all using (business_id in (select id from public.businesses where user_id = auth.uid()));
create policy "Users manage own permits" on public.permits for all using (business_id in (select id from public.businesses where user_id = auth.uid()));
create policy "Users manage own renewals" on public.renewal_history for all using (permit_id in (select p.id from public.permits p join public.businesses b on p.business_id = b.id where b.user_id = auth.uid()));

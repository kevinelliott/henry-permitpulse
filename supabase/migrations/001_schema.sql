-- PermitPulse Full Schema
-- Drop old tables if they exist (clean slate)
drop table if exists public.renewal_history cascade;
drop table if exists public.permits cascade;
drop table if exists public.permit_categories cascade;
drop table if exists public.businesses cascade;
drop table if exists public.certifications cascade;
drop table if exists public.employees cascade;
drop table if exists public.profiles cascade;
drop table if exists public.permit_templates cascade;

-- Profiles (extended user settings)
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  business_name text,
  industry text,
  state_code text,
  city text,
  slug text unique,
  plan text default 'free' check (plan in ('free', 'pro', 'business')),
  phone text,
  website text,
  address text,
  onboarding_complete boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Permits
create table public.permits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  type text,
  category text,
  issuing_agency text,
  agency_url text,
  issue_date date,
  expiry_date date,
  status text default 'active' check (status in ('active','expired','pending','revoked','one_time')),
  renewal_cost numeric(10,2),
  penalty_amount numeric(10,2),
  notes text,
  permit_number text,
  filing_type text default 'online',
  required_docs text[],
  tips text,
  is_one_time boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id, name)
);

-- Employees
create table public.employees (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  role text,
  email text,
  phone text,
  hire_date date,
  created_at timestamptz default now(),
  unique(user_id, email)
);

-- Certifications
create table public.certifications (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid references public.employees(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  cert_type text not null,
  issue_date date,
  expiry_date date,
  upload_token text unique default md5(random()::text || clock_timestamp()::text),
  file_url text,
  file_name text,
  status text default 'pending' check (status in ('pending','uploaded','verified','expired')),
  created_at timestamptz default now(),
  unique(employee_id, cert_type)
);

-- Permit Templates (industry + state intelligence)
create table public.permit_templates (
  id uuid primary key default gen_random_uuid(),
  industry text not null,
  state_code text not null,
  permit_name text not null,
  category text,
  typical_renewal_cycle text,
  typical_cost_min numeric(10,2),
  typical_cost_max numeric(10,2),
  penalty_range_min numeric(10,2),
  penalty_range_max numeric(10,2),
  agency_name text,
  agency_url text,
  filing_type text default 'online',
  required_docs text[],
  tips text,
  is_one_time boolean default false,
  sort_order integer default 0
);

-- Enable RLS
alter table public.profiles enable row level security;
alter table public.permits enable row level security;
alter table public.employees enable row level security;
alter table public.certifications enable row level security;
alter table public.permit_templates enable row level security;

-- RLS Policies
create policy "Users manage own profile" on public.profiles for all using (auth.uid() = id);
create policy "Users manage own permits" on public.permits for all using (auth.uid() = user_id);
create policy "Users manage own employees" on public.employees for all using (auth.uid() = user_id);
create policy "Users manage own certifications" on public.certifications for all using (auth.uid() = user_id);
create policy "Public read certifications by token" on public.certifications for select using (true);
create policy "Public insert certifications" on public.certifications for insert with check (true);
create policy "Public update certifications" on public.certifications for update using (true);
create policy "Public read permit_templates" on public.permit_templates for select using (true);
create policy "Public read profiles by slug" on public.profiles for select using (true);
create policy "Public read permits for badge" on public.permits for select using (true);

-- Indexes
create index idx_permits_user_id on public.permits(user_id);
create index idx_permits_expiry on public.permits(expiry_date);
create index idx_employees_user_id on public.employees(user_id);
create index idx_certifications_employee on public.certifications(employee_id);
create index idx_certifications_token on public.certifications(upload_token);
create index idx_profiles_slug on public.profiles(slug);
create index idx_templates_industry_state on public.permit_templates(industry, state_code);

-- Function: auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id)
  values (new.id);
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

create extension if not exists "pgcrypto";

create table if not exists public.members (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  birth_date date not null,
  status text not null default 'pending',
  role text not null default 'member',
  created_at timestamptz not null default now(),
  approved_at timestamptz,
  constraint members_status_check check (status in ('pending', 'approved', 'blocked')),
  constraint members_role_check check (role in ('member', 'admin')),
  constraint members_name_birth_date_unique unique (name, birth_date)
);

create index if not exists members_status_idx on public.members (status);
create index if not exists members_role_idx on public.members (role);
create index if not exists members_created_at_idx on public.members (created_at desc);

create table if not exists public.photo_records (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.members (id) on delete cascade,
  image_path text not null,
  certified_date date not null,
  uploaded_at timestamptz not null default now(),
  status text not null default 'active',
  constraint photo_records_status_check check (status in ('active', 'deleted'))
);

create index if not exists photo_records_member_id_idx on public.photo_records (member_id);
create index if not exists photo_records_certified_date_idx on public.photo_records (certified_date);
create index if not exists photo_records_uploaded_at_idx on public.photo_records (uploaded_at desc);
create index if not exists photo_records_status_idx on public.photo_records (status);
create index if not exists photo_records_member_date_active_idx
  on public.photo_records (member_id, certified_date)
  where status = 'active';

create table if not exists public.sessions (
  id uuid primary key default gen_random_uuid(),
  member_id uuid references public.members (id) on delete cascade,
  is_admin boolean not null default false,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null
);

create index if not exists sessions_member_id_idx on public.sessions (member_id);
create index if not exists sessions_expires_at_idx on public.sessions (expires_at);

alter table public.members enable row level security;
alter table public.photo_records enable row level security;
alter table public.sessions enable row level security;

-- MVP security model:
-- All sensitive reads and writes are handled by Next.js API routes using
-- SUPABASE_SERVICE_ROLE_KEY on the server only. No client-side direct table
-- access policies are granted here.
--
-- First admin creation rule:
-- The /api/auth/setup-admin route must allow creation only when
-- count(*) from members where role = 'admin' is 0, and must validate ADMIN_CODE
-- on the server before inserting an approved admin member.
--
-- Duplicate signup rule:
-- The unique constraint on (name, birth_date) blocks duplicate signup attempts
-- regardless of pending, approved, or blocked status.

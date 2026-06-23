-- User profiles: the chosen identity behind an account (name, handle, birthday).
-- One row per auth user. Username is unique case-insensitively so it can serve as
-- a stable handle once the social features land. Cascades on user deletion.

create table if not exists public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  full_name     text,
  username      text,
  date_of_birth date,
  email         text,
  created_at    timestamptz not null default now()
);

-- Case-insensitive uniqueness: "Sam" and "sam" can't both exist.
create unique index if not exists profiles_username_lower_idx
  on public.profiles (lower(username));

alter table public.profiles enable row level security;

-- A user can only read and write their own row.
create policy "profiles_self" on public.profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);

-- Username availability check for the signup form. SECURITY DEFINER so it can see
-- across rows (RLS would otherwise hide other users), but it only ever returns a
-- boolean — never another user's data. True when the handle is free.
create or replace function public.username_available(uname text)
returns boolean
language sql
security definer
set search_path = ''
as $$
  select not exists (
    select 1 from public.profiles
    where lower(username) = lower(trim(uname))
      and id <> auth.uid()
  );
$$;

revoke all on function public.username_available(text) from public, anon;
grant execute on function public.username_available(text) to authenticated;

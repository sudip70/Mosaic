-- colors: pre-seeded daily color assignments
create table colors (
  id         uuid primary key default gen_random_uuid(),
  date       date unique not null,
  name       text not null,
  hex        text not null,
  created_at timestamptz default now()
);

-- photos: every photo a user captures
create table photos (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  date         date not null,
  color_id     uuid not null references colors(id),
  storage_path text not null,
  is_private   boolean default true,
  created_at   timestamptz default now()
);

create index photos_user_date on photos(user_id, date);

-- streaks: per-user streak tracking
create table streaks (
  user_id          uuid primary key references auth.users(id) on delete cascade,
  current_streak   integer default 0,
  longest_streak   integer default 0,
  last_active_date date,
  updated_at       timestamptz default now()
);

-- friendships: Phase 2
create table friendships (
  id           uuid primary key default gen_random_uuid(),
  requester_id uuid not null references auth.users(id) on delete cascade,
  addressee_id uuid not null references auth.users(id) on delete cascade,
  status       text not null check (status in ('pending','accepted','declined')),
  created_at   timestamptz default now(),
  unique(requester_id, addressee_id)
);

-- notices: Phase 2 quiet reactions
create table notices (
  id           uuid primary key default gen_random_uuid(),
  photo_id     uuid not null references photos(id) on delete cascade,
  from_user_id uuid not null references auth.users(id) on delete cascade,
  created_at   timestamptz default now(),
  unique(photo_id, from_user_id)
);

-- RLS
alter table photos    enable row level security;
alter table streaks   enable row level security;
alter table friendships enable row level security;
alter table notices   enable row level security;

-- photos: users can only read/write their own
create policy "own photos" on photos
  for all using (auth.uid() = user_id);

-- streaks: users can only read/write their own
create policy "own streaks" on streaks
  for all using (auth.uid() = user_id);

-- colors: public read (no auth needed)
alter table colors enable row level security;
create policy "colors public read" on colors
  for select using (true);

-- Ludo Dating backend schema for Supabase (Postgres + Auth + Realtime)
-- Run this in Supabase SQL Editor after creating a project.
create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (char_length(display_name) between 1 and 30),
  age smallint not null check (age >= 18 and age <= 99),
  bio text not null default '' check (char_length(bio) <= 240),
  interests text not null default '' check (char_length(interests) <= 160),
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.profiles enable row level security;
create policy "Authenticated users can view profiles" on public.profiles for select to authenticated using (true);
create policy "Users insert own profile" on public.profiles for insert to authenticated with check (auth.uid() = id);
create policy "Users update own profile" on public.profiles for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);

create table if not exists public.likes (
  id uuid primary key default gen_random_uuid(),
  from_user uuid not null references public.profiles(id) on delete cascade,
  to_user uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(from_user,to_user),
  check(from_user <> to_user)
);
alter table public.likes enable row level security;
create policy "Users see likes they sent or received" on public.likes for select to authenticated using (auth.uid() = from_user or auth.uid() = to_user);
create policy "Users send own likes" on public.likes for insert to authenticated with check (auth.uid() = from_user);
create policy "Users remove own likes" on public.likes for delete to authenticated using (auth.uid() = from_user);

create or replace view public.matches with (security_invoker = true) as
select a.from_user as user_a, a.to_user as user_b, greatest(a.created_at,b.created_at) as matched_at
from public.likes a join public.likes b on a.from_user=b.to_user and a.to_user=b.from_user
where a.from_user < a.to_user;

create table if not exists public.blocks (
  blocker_id uuid not null references public.profiles(id) on delete cascade,
  blocked_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key(blocker_id,blocked_id),
  check(blocker_id <> blocked_id)
);
alter table public.blocks enable row level security;
create policy "Users see blocks they create" on public.blocks for select to authenticated using (auth.uid() = blocker_id);
create policy "Users block from own account" on public.blocks for insert to authenticated with check (auth.uid() = blocker_id);
create policy "Users unblock from own account" on public.blocks for delete to authenticated using (auth.uid() = blocker_id);

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  reported_id uuid not null references public.profiles(id) on delete cascade,
  reason text not null check(char_length(reason) between 3 and 500),
  created_at timestamptz not null default now(),
  check(reporter_id <> reported_id)
);
alter table public.reports enable row level security;
create policy "Users submit reports as themselves" on public.reports for insert to authenticated with check (auth.uid() = reporter_id);
create policy "Users see reports they submitted" on public.reports for select to authenticated using (auth.uid() = reporter_id);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references public.profiles(id) on delete cascade,
  receiver_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check(char_length(body) between 1 and 2000),
  created_at timestamptz not null default now(),
  check(sender_id <> receiver_id)
);
alter table public.messages enable row level security;
create policy "Only chat participants can read messages" on public.messages for select to authenticated using (
 auth.uid() = sender_id or auth.uid() = receiver_id
);
create policy "Sender must be current user and not blocked" on public.messages for insert to authenticated with check (
 auth.uid() = sender_id
 and not exists (select 1 from public.blocks b where
   (b.blocker_id = sender_id and b.blocked_id = receiver_id)
   or (b.blocker_id = receiver_id and b.blocked_id = sender_id))
 and exists (select 1 from public.likes a join public.likes b on a.from_user=b.to_user and a.to_user=b.from_user
   where a.from_user=sender_id and a.to_user=receiver_id)
);
create index if not exists messages_conversation_idx on public.messages(sender_id, receiver_id, created_at);
create index if not exists likes_to_user_idx on public.likes(to_user);

-- A basic persisted game-room record. For turn validation and anti-cheat, all moves
-- must eventually be validated by a trusted server/Edge Function, not only the client.
create table if not exists public.game_rooms (
  id uuid primary key default gen_random_uuid(),
  host_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'waiting' check(status in ('waiting','playing','finished','cancelled')),
  state jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.game_room_players (
  room_id uuid not null references public.game_rooms(id) on delete cascade,
  player_id uuid not null references public.profiles(id) on delete cascade,
  seat smallint not null check(seat between 1 and 4),
  joined_at timestamptz not null default now(),
  primary key(room_id,player_id),
  unique(room_id,seat)
);
alter table public.game_rooms enable row level security;
alter table public.game_room_players enable row level security;
create policy "Room players can view rooms" on public.game_rooms for select to authenticated using (
 exists(select 1 from public.game_room_players p where p.room_id=id and p.player_id=auth.uid()) or host_id=auth.uid()
);
create policy "Users create own rooms" on public.game_rooms for insert to authenticated with check(host_id=auth.uid());
create policy "Room participants view participants" on public.game_room_players for select to authenticated using (
 exists(select 1 from public.game_room_players p where p.room_id=room_id and p.player_id=auth.uid())
);
create policy "Users join as themselves" on public.game_room_players for insert to authenticated with check(player_id=auth.uid());

-- Enable Realtime for messages and room state in Supabase Dashboard > Database > Publications.
-- Do not expose the service_role key in website or APK. Only the anon/publishable key is public.

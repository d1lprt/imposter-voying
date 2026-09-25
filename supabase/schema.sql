-- =========================================================================
-- Infiltrator — Supabase schema
-- Run this once in your project's SQL editor (or via `supabase db push`).
-- Safe to re-run: uses IF NOT EXISTS / CREATE OR REPLACE throughout.
-- =========================================================================

create extension if not exists "pgcrypto";

-- ------------------------------------------------------------------------
-- Tables
-- ------------------------------------------------------------------------

create table if not exists rooms (
  id           uuid primary key default gen_random_uuid(),
  room_code    text unique not null,
  host_id      uuid,
  max_players  int not null check (max_players between 4 and 20),
  status       text not null default 'LOBBY' check (status in ('LOBBY', 'VOTING', 'RESULTS')),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create table if not exists players (
  id         uuid primary key default gen_random_uuid(),
  room_id    uuid not null references rooms(id) on delete cascade,
  auth_id    uuid not null,
  name       text not null check (char_length(trim(name)) between 1 and 24),
  is_host    boolean not null default false,
  has_voted  boolean not null default false,
  joined_at  timestamptz not null default now(),
  unique (room_id, auth_id),
  unique (room_id, name)
);

do $$
begin
  if not exists (
    select 1 from information_schema.table_constraints
    where constraint_name = 'rooms_host_fk'
  ) then
    alter table rooms
      add constraint rooms_host_fk foreign key (host_id) references players(id) on delete set null;
  end if;
end $$;

create table if not exists votes (
  id           uuid primary key default gen_random_uuid(),
  room_id      uuid not null references rooms(id) on delete cascade,
  voter_id     uuid not null references players(id) on delete cascade,
  target_id    uuid not null references players(id) on delete cascade,
  vote_number  smallint not null check (vote_number in (1, 2)),
  created_at   timestamptz not null default now(),
  unique (room_id, voter_id, vote_number),
  check (voter_id <> target_id)
);

create index if not exists idx_players_room on players(room_id);
create index if not exists idx_votes_room on votes(room_id);
create index if not exists idx_votes_target on votes(room_id, target_id);
create index if not exists idx_rooms_created_at on rooms(created_at);

-- ------------------------------------------------------------------------
-- Row Level Security
-- All writes go through the SECURITY DEFINER functions below, which check
-- auth.uid() themselves — so no INSERT/UPDATE/DELETE policies are granted
-- to the client role on any table. Reads are scoped narrowly, in
-- particular votes are invisible to everyone until the room is in RESULTS.
-- ------------------------------------------------------------------------

alter table rooms   enable row level security;
alter table players enable row level security;
alter table votes   enable row level security;

drop policy if exists "rooms_select" on rooms;
create policy "rooms_select" on rooms for select using (true);

drop policy if exists "players_select" on players;
create policy "players_select" on players for select using (true);

drop policy if exists "votes_select_results_or_own" on votes;
create policy "votes_select_results_or_own" on votes for select
  using (
    exists (select 1 from rooms r where r.id = votes.room_id and r.status = 'RESULTS')
    or voter_id in (select id from players p where p.auth_id = auth.uid() and p.room_id = votes.room_id)
  );

-- ------------------------------------------------------------------------
-- Helper: room code generator (5 chars, no ambiguous glyphs)
-- ------------------------------------------------------------------------

create or replace function generate_room_code()
returns text
language plpgsql
as $$
declare
  chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  code text;
  taken boolean;
begin
  loop
    code := '';
    for i in 1..5 loop
      code := code || substr(chars, floor(random() * length(chars) + 1)::int, 1);
    end loop;
    select exists(select 1 from rooms where room_code = code) into taken;
    exit when not taken;
  end loop;
  return code;
end;
$$;

-- ------------------------------------------------------------------------
-- create_room: creates the room and seats the caller as host, atomically.
-- ------------------------------------------------------------------------

create or replace function create_room(p_max_players int, p_host_name text)
returns table(room_id uuid, room_code text, player_id uuid)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_room_id uuid;
  v_code text;
  v_player_id uuid;
begin
  if auth.uid() is null then
    raise exception 'NOT_AUTHENTICATED';
  end if;
  if p_max_players < 4 or p_max_players > 20 then
    raise exception 'INVALID_MAX_PLAYERS';
  end if;
  if trim(coalesce(p_host_name, '')) = '' then
    raise exception 'NAME_REQUIRED';
  end if;

  v_code := generate_room_code();

  insert into rooms (room_code, max_players, status)
  values (v_code, p_max_players, 'LOBBY')
  returning id into v_room_id;

  insert into players (room_id, auth_id, name, is_host)
  values (v_room_id, auth.uid(), trim(p_host_name), true)
  returning id into v_player_id;

  update rooms set host_id = v_player_id where id = v_room_id;

  return query select v_room_id, v_code, v_player_id;
end;
$$;

-- ------------------------------------------------------------------------
-- join_room: validates + seats a player. Re-entrant: if this auth_id is
-- already in the room (refresh / reconnect), it returns the existing seat
-- instead of erroring or duplicating.
-- ------------------------------------------------------------------------

create or replace function join_room(p_room_code text, p_name text)
returns table(room_id uuid, player_id uuid)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_room rooms%rowtype;
  v_count int;
  v_player_id uuid;
  v_existing uuid;
begin
  if auth.uid() is null then
    raise exception 'NOT_AUTHENTICATED';
  end if;
  if trim(coalesce(p_name, '')) = '' then
    raise exception 'NAME_REQUIRED';
  end if;

  select * into v_room from rooms where room_code = upper(trim(p_room_code));
  if not found then
    raise exception 'ROOM_NOT_FOUND';
  end if;

  select id into v_existing from players where room_id = v_room.id and auth_id = auth.uid();
  if v_existing is not null then
    return query select v_room.id, v_existing;
    return;
  end if;

  if v_room.status <> 'LOBBY' then
    raise exception 'GAME_STARTED';
  end if;

  select count(*) into v_count from players where room_id = v_room.id;
  if v_count >= v_room.max_players then
    raise exception 'ROOM_FULL';
  end if;

  if exists (
    select 1 from players where room_id = v_room.id and lower(name) = lower(trim(p_name))
  ) then
    raise exception 'NAME_TAKEN';
  end if;

  insert into players (room_id, auth_id, name, is_host)
  values (v_room.id, auth.uid(), trim(p_name), false)
  returning id into v_player_id;

  return query select v_room.id, v_player_id;
end;
$$;

-- ------------------------------------------------------------------------
-- start_voting: host-only, requires the room to be full.
-- ------------------------------------------------------------------------

create or replace function start_voting(p_room_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_room rooms%rowtype;
  v_player players%rowtype;
  v_count int;
begin
  select * into v_room from rooms where id = p_room_id;
  if not found then raise exception 'ROOM_NOT_FOUND'; end if;

  select * into v_player from players where room_id = p_room_id and auth_id = auth.uid();
  if not found or not v_player.is_host then
    raise exception 'NOT_HOST';
  end if;

  if v_room.status <> 'LOBBY' then
    raise exception 'INVALID_STATE';
  end if;

  select count(*) into v_count from players where room_id = p_room_id;
  if v_count < v_room.max_players then
    raise exception 'NOT_ENOUGH_PLAYERS';
  end if;

  update rooms set status = 'VOTING', updated_at = now() where id = p_room_id;
end;
$$;

-- ------------------------------------------------------------------------
-- submit_votes: exactly 2 targets, no self-votes, no double submission.
-- Auto-advances the room to RESULTS once everyone has voted.
-- ------------------------------------------------------------------------

create or replace function submit_votes(p_room_id uuid, p_targets uuid[])
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_room rooms%rowtype;
  v_voter players%rowtype;
  v_remaining int;
  t uuid;
begin
  select * into v_room from rooms where id = p_room_id;
  if not found then raise exception 'ROOM_NOT_FOUND'; end if;
  if v_room.status <> 'VOTING' then raise exception 'NOT_VOTING'; end if;

  select * into v_voter from players where room_id = p_room_id and auth_id = auth.uid();
  if not found then raise exception 'NOT_IN_ROOM'; end if;
  if v_voter.has_voted then raise exception 'ALREADY_VOTED'; end if;

  if p_targets is null or array_length(p_targets, 1) is distinct from 2 then
    raise exception 'MUST_HAVE_TWO_VOTES';
  end if;

  foreach t in array p_targets loop
    if t = v_voter.id then raise exception 'NO_SELF_VOTE'; end if;
    if not exists (select 1 from players where id = t and room_id = p_room_id) then
      raise exception 'INVALID_TARGET';
    end if;
  end loop;

  insert into votes (room_id, voter_id, target_id, vote_number)
  values
    (p_room_id, v_voter.id, p_targets[1], 1),
    (p_room_id, v_voter.id, p_targets[2], 2);

  update players set has_voted = true where id = v_voter.id;

  select count(*) into v_remaining from players where room_id = p_room_id and has_voted = false;
  if v_remaining = 0 then
    update rooms set status = 'RESULTS', updated_at = now() where id = p_room_id;
  end if;
end;
$$;

-- ------------------------------------------------------------------------
-- restart_voting: host-only "tiebreaker" — wipes votes and jumps straight
-- back into VOTING without returning to the lobby.
-- ------------------------------------------------------------------------

create or replace function restart_voting(p_room_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_room rooms%rowtype;
  v_player players%rowtype;
begin
  select * into v_room from rooms where id = p_room_id;
  if not found then raise exception 'ROOM_NOT_FOUND'; end if;

  select * into v_player from players where room_id = p_room_id and auth_id = auth.uid();
  if not found or not v_player.is_host then raise exception 'NOT_HOST'; end if;
  if v_room.status <> 'RESULTS' then raise exception 'INVALID_STATE'; end if;

  delete from votes where room_id = p_room_id;
  update players set has_voted = false where room_id = p_room_id;
  update rooms set status = 'VOTING', updated_at = now() where id = p_room_id;
end;
$$;

-- ------------------------------------------------------------------------
-- play_again: host-only — resets votes and returns everyone to the lobby.
-- ------------------------------------------------------------------------

create or replace function play_again(p_room_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_player players%rowtype;
begin
  select * into v_player from players where room_id = p_room_id and auth_id = auth.uid();
  if not found or not v_player.is_host then raise exception 'NOT_HOST'; end if;

  delete from votes where room_id = p_room_id;
  update players set has_voted = false where room_id = p_room_id;
  update rooms set status = 'LOBBY', updated_at = now() where id = p_room_id;
end;
$$;

-- ------------------------------------------------------------------------
-- leave_room: removes the caller's own seat. If they were host, hands the
-- crown to whoever joined next.
-- ------------------------------------------------------------------------

create or replace function leave_room(p_room_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_player players%rowtype;
  v_new_host uuid;
begin
  select * into v_player from players where room_id = p_room_id and auth_id = auth.uid();
  if not found then return; end if;

  delete from players where id = v_player.id;

  if v_player.is_host then
    select id into v_new_host from players where room_id = p_room_id order by joined_at asc limit 1;
    if v_new_host is not null then
      update players set is_host = true where id = v_new_host;
      update rooms set host_id = v_new_host where id = p_room_id;
    else
      update rooms set host_id = null where id = p_room_id;
    end if;
  end if;
end;
$$;

grant execute on all functions in schema public to anon, authenticated;

-- ------------------------------------------------------------------------
-- Room expiration
-- Deletes rooms (and cascades players/votes) older than 24 hours.
-- Call this on a schedule — see README for two ways to wire it up.
-- ------------------------------------------------------------------------

create or replace function cleanup_expired_rooms()
returns void
language sql
as $$
  delete from rooms where created_at < now() - interval '24 hours';
$$;

-- If your project has the pg_cron extension enabled (Database > Extensions
-- in the Supabase dashboard), you can schedule cleanup directly in Postgres:
--
--   select cron.schedule('cleanup-expired-rooms', '0 * * * *', $$select cleanup_expired_rooms();$$);

-- ------------------------------------------------------------------------
-- Realtime: add these tables to the realtime publication so the frontend's
-- postgres_changes subscriptions actually receive events. This is required
-- even though the tables exist — Supabase only streams changes for tables
-- explicitly added to `supabase_realtime`.
-- ------------------------------------------------------------------------

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'rooms'
  ) then
    alter publication supabase_realtime add table rooms;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'players'
  ) then
    alter publication supabase_realtime add table players;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'votes'
  ) then
    alter publication supabase_realtime add table votes;
  end if;
end $$;

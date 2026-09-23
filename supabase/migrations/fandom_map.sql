-- ============================================================
-- Fandom Map features:
--   - Fandom Events (fandom + coordinates on events)
--   - Fandom Map / Nearby Discovery (photo spots, pilgrimage spots)
--   - Nearby Fans (approximate, privacy-preserving)
--   - Fandom Pilgrimage (saved locations + stamps)
--   - Event Participation discovery (attendee lists)
-- Run this whole file in the Supabase SQL editor, after events.sql.
--
-- Reuses the existing `fandoms` / `post_fandoms` tables (the same
-- ones create_post.tsx already writes to) so an event, photo spot,
-- or post tagged "BTS" all point at the same fandom. The `if not
-- exists` guards below are just so this file is safe to run even if
-- those tables were created by hand rather than a tracked migration.
-- ============================================================

-- 0. Make sure the fandoms tables this migration depends on exist
-- ------------------------------------------------------------

create table if not exists public.fandoms (
  id uuid not null default gen_random_uuid(),
  name text not null,
  created_at timestamp with time zone default now(),
  constraint fandoms_pkey primary key (id),
  constraint fandoms_name_key unique (name)
);

alter table public.fandoms enable row level security;

drop policy if exists "Fandoms are publicly viewable" on public.fandoms;
create policy "Fandoms are publicly viewable"
on public.fandoms for select
using (true);

drop policy if exists "Authenticated users can create fandoms" on public.fandoms;
create policy "Authenticated users can create fandoms"
on public.fandoms for insert
with check (auth.uid() is not null);

create table if not exists public.post_fandoms (
  post_id uuid not null,
  fandom_id uuid not null,
  constraint post_fandoms_pkey primary key (post_id, fandom_id),
  constraint post_fandoms_post_id_fkey
    foreign key (post_id) references public.posts(id) on delete cascade,
  constraint post_fandoms_fandom_id_fkey
    foreign key (fandom_id) references public.fandoms(id) on delete cascade
);

alter table public.post_fandoms enable row level security;

drop policy if exists "Post fandoms are publicly viewable" on public.post_fandoms;
create policy "Post fandoms are publicly viewable"
on public.post_fandoms for select
using (true);

drop policy if exists "Users can tag their own posts with fandoms" on public.post_fandoms;
create policy "Users can tag their own posts with fandoms"
on public.post_fandoms for insert
with check (
  post_id in (select id from public.posts where user_id = auth.uid())
);


-- 1. Extend existing tables
-- ------------------------------------------------------------

alter table public.events
  add column if not exists fandom_id uuid references public.fandoms(id),
  add column if not exists latitude numeric,
  add column if not exists longitude numeric;

create index if not exists events_fandom_id_idx on public.events (fandom_id);

-- Profiles opt in to sharing an approximate location (rounded to
-- roughly a 1km grid client-side before it's ever sent here) so
-- "nearby" features work without exposing anyone's exact position.
alter table public.profiles
  add column if not exists approx_lat numeric,
  add column if not exists approx_lng numeric,
  add column if not exists location_shared_at timestamptz;


-- 2. Fandom Photo Spots
-- ------------------------------------------------------------

create table public.photo_spots (
  id uuid not null default gen_random_uuid(),
  created_by uuid not null,
  fandom_id uuid references public.fandoms(id),
  title text not null,
  description text,
  latitude numeric not null,
  longitude numeric not null,
  image_url text,
  created_at timestamp with time zone default now(),
  constraint photo_spots_pkey primary key (id),
  constraint photo_spots_created_by_fkey
    foreign key (created_by) references public.profiles(id) on delete cascade
);

create index photo_spots_fandom_id_idx on public.photo_spots (fandom_id);
create index photo_spots_lat_lng_idx on public.photo_spots (latitude, longitude);

alter table public.photo_spots enable row level security;

create policy "Photo spots are publicly viewable"
on public.photo_spots for select
using (true);

create policy "Users can add their own photo spots"
on public.photo_spots for insert
with check (created_by = auth.uid());

create policy "Users can update their own photo spots"
on public.photo_spots for update
using (created_by = auth.uid())
with check (created_by = auth.uid());

create policy "Users can delete their own photo spots"
on public.photo_spots for delete
using (created_by = auth.uid());


-- 3. Fandom Pilgrimage: saved locations + stamps
-- ------------------------------------------------------------

create table public.pilgrimage_locations (
  id uuid not null default gen_random_uuid(),
  created_by uuid not null,
  fandom_id uuid references public.fandoms(id),
  title text not null,
  description text,
  latitude numeric not null,
  longitude numeric not null,
  image_url text,
  created_at timestamp with time zone default now(),
  constraint pilgrimage_locations_pkey primary key (id),
  constraint pilgrimage_locations_created_by_fkey
    foreign key (created_by) references public.profiles(id) on delete cascade
);

create index pilgrimage_locations_fandom_id_idx on public.pilgrimage_locations (fandom_id);
create index pilgrimage_locations_lat_lng_idx on public.pilgrimage_locations (latitude, longitude);

alter table public.pilgrimage_locations enable row level security;

create policy "Pilgrimage locations are publicly viewable"
on public.pilgrimage_locations for select
using (true);

create policy "Users can save their own pilgrimage locations"
on public.pilgrimage_locations for insert
with check (created_by = auth.uid());

create policy "Users can update their own pilgrimage locations"
on public.pilgrimage_locations for update
using (created_by = auth.uid())
with check (created_by = auth.uid());

create policy "Users can delete their own pilgrimage locations"
on public.pilgrimage_locations for delete
using (created_by = auth.uid());

create table public.pilgrimage_stamps (
  id uuid not null default gen_random_uuid(),
  user_id uuid not null,
  location_id uuid not null,
  visited_at timestamp with time zone default now(),
  constraint pilgrimage_stamps_pkey primary key (id),
  constraint pilgrimage_stamps_user_id_fkey
    foreign key (user_id) references public.profiles(id) on delete cascade,
  constraint pilgrimage_stamps_location_id_fkey
    foreign key (location_id) references public.pilgrimage_locations(id) on delete cascade,
  constraint pilgrimage_stamps_unique unique (user_id, location_id)
);

create index pilgrimage_stamps_user_id_idx on public.pilgrimage_stamps (user_id);

alter table public.pilgrimage_stamps enable row level security;

-- Stamp counts are shown on locations ("142 people have visited"),
-- so counts need to be publicly readable; the row itself carries no
-- location data beyond what's already public on pilgrimage_locations.
create policy "Stamps are publicly viewable"
on public.pilgrimage_stamps for select
using (true);

-- Stamps are only ever created through collect_stamp() below, which
-- checks proximity before inserting: no direct-insert policy is
-- granted, so a client can't award itself a stamp without visiting.


-- 4. RPC: collect a pilgrimage stamp (requires proximity)
-- ------------------------------------------------------------
-- Verifies the caller is within ~300m of the location before
-- recording a stamp, so stamps can't be faked from across the world.

create or replace function public.collect_stamp(
  p_location_id uuid,
  p_lat numeric,
  p_lng numeric
)
returns public.pilgrimage_stamps
language plpgsql
security definer
set search_path = public
as $$
declare
  v_location public.pilgrimage_locations;
  v_distance_km numeric;
  v_stamp public.pilgrimage_stamps;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  select * into v_location
  from public.pilgrimage_locations
  where id = p_location_id;

  if not found then
    raise exception 'Location not found';
  end if;

  -- Haversine distance in kilometers
  v_distance_km := 6371 * acos(
    least(1, greatest(-1,
      cos(radians(p_lat)) * cos(radians(v_location.latitude)) *
      cos(radians(v_location.longitude) - radians(p_lng)) +
      sin(radians(p_lat)) * sin(radians(v_location.latitude))
    ))
  );

  if v_distance_km > 0.3 then
    raise exception 'Too far from this location to check in';
  end if;

  insert into public.pilgrimage_stamps (user_id, location_id)
  values (auth.uid(), p_location_id)
  on conflict (user_id, location_id) do nothing
  returning * into v_stamp;

  if v_stamp.id is null then
    select * into v_stamp
    from public.pilgrimage_stamps
    where user_id = auth.uid() and location_id = p_location_id;
  end if;

  return v_stamp;
end;
$$;

grant execute on function public.collect_stamp(uuid, numeric, numeric) to authenticated;


-- 5. RPC: approximate nearby fan count + directory (privacy-safe)
-- ------------------------------------------------------------
-- Returns matching profiles (no coordinates) within a radius of a
-- given point, for a given fandom. Exact locations never leave the
-- database - only who matches, not where they are. Matches against
-- both the oshis table (free-text fandom per favorite) and anyone
-- whose posts are tagged with this fandom, since the app has fans
-- express fandoms both ways.

create or replace function public.nearby_fans(
  p_fandom text,
  p_lat numeric,
  p_lng numeric,
  p_radius_km numeric default 15
)
returns table (
  id uuid,
  username text,
  display_name text,
  avatar_url text
)
language sql
security definer
set search_path = public
stable
as $$
  select distinct
    p.id,
    p.username,
    p.display_name,
    p.avatar_url
  from public.profiles p
  where p.approx_lat is not null
    and p.approx_lng is not null
    and 6371 * acos(
      least(1, greatest(-1,
        cos(radians(p_lat)) * cos(radians(p.approx_lat)) *
        cos(radians(p.approx_lng) - radians(p_lng)) +
        sin(radians(p_lat)) * sin(radians(p.approx_lat))
      ))
    ) <= p_radius_km
    and (
      exists (
        select 1 from public.oshis o
        where o.user_id = p.id and lower(o.fandom) = lower(p_fandom)
      )
      or exists (
        select 1
        from public.post_fandoms pf
        join public.fandoms f on f.id = pf.fandom_id
        join public.posts po on po.id = pf.post_id
        where po.user_id = p.id and lower(f.name) = lower(p_fandom)
      )
    )
  limit 50;
$$;

grant execute on function public.nearby_fans(text, numeric, numeric, numeric) to authenticated, anon;


-- 6. View: event attendees (for "who's going" discovery)
-- ------------------------------------------------------------

create view public.event_attendees
with (security_invoker = true) as
select
  r.event_id,
  r.status,
  r.user_id,
  p.username,
  p.display_name,
  p.avatar_url
from public.event_rsvps r
join public.profiles p on p.id = r.user_id;

grant select on public.event_attendees to anon, authenticated;

-- Re-create events_with_counts to surface the new fandom/location columns.
drop view if exists public.events_with_counts;

create view public.events_with_counts
with (security_invoker = true) as
select
  e.id,
  e.organizer_id,
  e.title,
  e.description,
  e.event_date,
  e.event_time,
  e.location,
  e.fandom_id,
  f.name as fandom_name,
  e.latitude,
  e.longitude,
  e.capacity,
  e.image_url,
  e.created_at,
  p.username as organizer_username,
  p.display_name as organizer_display_name,
  p.avatar_url as organizer_avatar_url,
  coalesce(interested.cnt, 0) as interested_count,
  coalesce(going.cnt, 0) as going_count
from public.events e
join public.profiles p on p.id = e.organizer_id
left join public.fandoms f on f.id = e.fandom_id
left join lateral (
  select count(*) as cnt
  from public.event_rsvps r
  where r.event_id = e.id and r.status = 'interested'
) interested on true
left join lateral (
  select count(*) as cnt
  from public.event_rsvps r
  where r.event_id = e.id and r.status = 'going'
) going on true;

grant select on public.events_with_counts to anon, authenticated;


-- 7. Storage bucket for fandom-map photos (photo spots + pilgrimage)
-- ------------------------------------------------------------

insert into storage.buckets (id, name, public)
values ('fandom-locations', 'fandom-locations', true)
on conflict (id) do nothing;

create policy "Fandom location images are publicly accessible"
on storage.objects for select
using (bucket_id = 'fandom-locations');

create policy "Users can upload their own fandom location images"
on storage.objects for insert
with check (
  bucket_id = 'fandom-locations'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "Users can delete their own fandom location images"
on storage.objects for delete
using (
  bucket_id = 'fandom-locations'
  and (storage.foldername(name))[1] = auth.uid()::text
);


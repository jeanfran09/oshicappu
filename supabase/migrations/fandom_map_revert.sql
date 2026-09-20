-- ============================================================
-- REVERT for fandom_map.sql
-- ============================================================
-- Undoes the Fandom Map feature set: photo spots, pilgrimage
-- locations/stamps, nearby-fans/check-in RPCs, event
-- fandom/coordinates, and the profiles approximate-location columns.
--
-- Does NOT touch `fandoms` / `post_fandoms` - those predate this
-- feature and still power fandom tags on posts.
--
-- BACK UP FIRST if you want to keep any photo spots, pilgrimage
-- data, or event fandom/location tags added since fandom_map.sql
-- ran - this permanently deletes them.
-- ============================================================

-- 1. Storage: remove fandom-locations bucket + its policies
-- ------------------------------------------------------------

drop policy if exists "Fandom location images are publicly accessible" on storage.objects;
drop policy if exists "Users can upload their own fandom location images" on storage.objects;
drop policy if exists "Users can delete their own fandom location images" on storage.objects;

delete from storage.objects where bucket_id = 'fandom-locations';
delete from storage.buckets where id = 'fandom-locations';


-- 2. Views
-- ------------------------------------------------------------

drop view if exists public.event_attendees;
drop view if exists public.events_with_counts;

-- Restore events_with_counts exactly as events.sql defined it,
-- before fandom_id/latitude/longitude existed.
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


-- 3. Functions
-- ------------------------------------------------------------

drop function if exists public.nearby_fans(text, numeric, numeric, numeric);
drop function if exists public.collect_stamp(uuid, numeric, numeric);


-- 4. Pilgrimage tables
-- ------------------------------------------------------------

drop policy if exists "Stamps are publicly viewable" on public.pilgrimage_stamps;
drop table if exists public.pilgrimage_stamps;

drop policy if exists "Pilgrimage locations are publicly viewable" on public.pilgrimage_locations;
drop policy if exists "Users can save their own pilgrimage locations" on public.pilgrimage_locations;
drop policy if exists "Users can update their own pilgrimage locations" on public.pilgrimage_locations;
drop policy if exists "Users can delete their own pilgrimage locations" on public.pilgrimage_locations;
drop table if exists public.pilgrimage_locations;


-- 5. Photo spots
-- ------------------------------------------------------------

drop policy if exists "Photo spots are publicly viewable" on public.photo_spots;
drop policy if exists "Users can add their own photo spots" on public.photo_spots;
drop policy if exists "Users can update their own photo spots" on public.photo_spots;
drop policy if exists "Users can delete their own photo spots" on public.photo_spots;
drop table if exists public.photo_spots;


-- 6. Column additions
-- ------------------------------------------------------------

alter table public.profiles
  drop column if exists approx_lat,
  drop column if exists approx_lng,
  drop column if exists location_shared_at;

alter table public.events
  drop column if exists fandom_id,
  drop column if exists latitude,
  drop column if exists longitude;

-- Note: fandoms / post_fandoms and their policies are intentionally
-- left in place - they existed before fandom_map.sql and still back
-- fandom tags on posts.

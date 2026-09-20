-- ============================================================
-- Events: tables, RLS policies, storage bucket, and a helper
-- view for feed/list queries.
-- Run this whole file in the Supabase SQL editor.
-- ============================================================

-- 1. Tables
-- ------------------------------------------------------------

create table public.events (
  id uuid not null default gen_random_uuid(),
  organizer_id uuid not null,
  title text not null,
  description text,
  event_date date not null,
  event_time time,
  location text,
  capacity integer,
  image_url text,
  created_at timestamp with time zone default now(),
  constraint events_pkey primary key (id),
  constraint events_organizer_id_fkey
    foreign key (organizer_id) references public.profiles(id) on delete cascade
);

create table public.event_rsvps (
  event_id uuid not null,
  user_id uuid not null,
  status text not null,
  created_at timestamp with time zone default now(),
  constraint event_rsvps_pkey primary key (event_id, user_id),
  constraint event_rsvps_status_check check (status in ('interested', 'going')),
  constraint event_rsvps_event_id_fkey
    foreign key (event_id) references public.events(id) on delete cascade,
  constraint event_rsvps_user_id_fkey
    foreign key (user_id) references public.profiles(id) on delete cascade
);

-- Reuses the existing `hashtags` table (also used by posts).
create table public.event_hashtags (
  event_id uuid not null,
  hashtag_id uuid not null,
  constraint event_hashtags_pkey primary key (event_id, hashtag_id),
  constraint event_hashtags_event_id_fkey
    foreign key (event_id) references public.events(id) on delete cascade,
  constraint event_hashtags_hashtag_id_fkey
    foreign key (hashtag_id) references public.hashtags(id) on delete cascade
);

create index events_organizer_id_idx on public.events (organizer_id);
create index events_event_date_idx on public.events (event_date);
create index event_rsvps_event_id_idx on public.event_rsvps (event_id);
create index event_rsvps_user_id_idx on public.event_rsvps (user_id);
create index event_hashtags_hashtag_id_idx on public.event_hashtags (hashtag_id);


-- 2. Row Level Security
-- ------------------------------------------------------------

alter table public.events enable row level security;
alter table public.event_rsvps enable row level security;
alter table public.event_hashtags enable row level security;

-- Events: anyone can browse events (public discovery feed)
create policy "Events are publicly viewable"
on public.events for select
using (true);

-- Events: you can only create events under your own name
create policy "Users can create their own events"
on public.events for insert
with check (organizer_id = auth.uid());

-- Events: only the organizer can edit or delete their event
create policy "Organizers can update their own events"
on public.events for update
using (organizer_id = auth.uid())
with check (organizer_id = auth.uid());

create policy "Organizers can delete their own events"
on public.events for delete
using (organizer_id = auth.uid());

-- RSVPs: readable by anyone (needed to show interested/going counts)
create policy "RSVPs are publicly viewable"
on public.event_rsvps for select
using (true);

-- RSVPs: you can only RSVP, update, or remove your own RSVP
create policy "Users can RSVP as themselves"
on public.event_rsvps for insert
with check (user_id = auth.uid());

create policy "Users can update their own RSVP"
on public.event_rsvps for update
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy "Users can remove their own RSVP"
on public.event_rsvps for delete
using (user_id = auth.uid());

-- Event hashtags: readable by anyone, editable only by the organizer
create policy "Event hashtags are publicly viewable"
on public.event_hashtags for select
using (true);

create policy "Organizers can tag their own events"
on public.event_hashtags for insert
with check (
  event_id in (
    select id from public.events where organizer_id = auth.uid()
  )
);

create policy "Organizers can remove tags from their own events"
on public.event_hashtags for delete
using (
  event_id in (
    select id from public.events where organizer_id = auth.uid()
  )
);


-- 3. Storage bucket for event photos
-- ------------------------------------------------------------

insert into storage.buckets (id, name, public)
values ('events', 'events', true)
on conflict (id) do nothing;

create policy "Event images are publicly accessible"
on storage.objects for select
using (bucket_id = 'events');

create policy "Users can upload their own event images"
on storage.objects for insert
with check (
  bucket_id = 'events'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "Users can delete their own event images"
on storage.objects for delete
using (
  bucket_id = 'events'
  and (storage.foldername(name))[1] = auth.uid()::text
);


-- 4. Helper view: events with RSVP counts + organizer info
-- ------------------------------------------------------------
-- `security_invoker` makes the view run under the querying
-- user's own RLS, same as querying the base tables directly.

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

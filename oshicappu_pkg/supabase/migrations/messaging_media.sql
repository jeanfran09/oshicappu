-- ============================================================
-- Adds media (image) support to direct messages.
-- Run this AFTER messaging.sql, in the Supabase SQL editor.
-- ============================================================

-- 1. Allow messages to carry an image, with or without text.
-- ------------------------------------------------------------

alter table public.messages
  alter column content drop not null;

alter table public.messages
  add column image_url text;

alter table public.messages
  add constraint messages_content_or_image_check
  check (content is not null or image_url is not null);


-- 2. Storage bucket for message images.
-- ------------------------------------------------------------

insert into storage.buckets (id, name, public)
values ('messages', 'messages', true)
on conflict (id) do nothing;

-- Anyone can view message images (the bucket is public, same
-- as post images), but only the uploader can add/remove files
-- in their own folder (path prefix = their user id).

create policy "Message images are publicly accessible"
on storage.objects for select
using (bucket_id = 'messages');

create policy "Users can upload their own message images"
on storage.objects for insert
with check (
  bucket_id = 'messages'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "Users can delete their own message images"
on storage.objects for delete
using (
  bucket_id = 'messages'
  and (storage.foldername(name))[1] = auth.uid()::text
);


-- 3. Update get_conversations() so the inbox preview shows a
--    "📷 Photo" placeholder for image-only messages.
-- ------------------------------------------------------------

create or replace function public.get_conversations()
returns table (
  conversation_id uuid,
  other_user_id uuid,
  other_username text,
  other_display_name text,
  other_avatar_url text,
  last_message text,
  last_message_at timestamptz,
  unread_count integer
)
language sql
security invoker
as $$
  select
    cp.conversation_id,
    other.id as other_user_id,
    other.username as other_username,
    other.display_name as other_display_name,
    other.avatar_url as other_avatar_url,
    coalesce(
      lm.content,
      case when lm.image_url is not null then '📷 Photo' else null end
    ) as last_message,
    lm.created_at as last_message_at,
    coalesce(uc.cnt, 0)::integer as unread_count
  from conversation_participants cp
  join conversation_participants other_cp
    on other_cp.conversation_id = cp.conversation_id
    and other_cp.user_id != auth.uid()
  join profiles other
    on other.id = other_cp.user_id
  left join lateral (
    select content, image_url, created_at
    from messages m
    where m.conversation_id = cp.conversation_id
    order by m.created_at desc
    limit 1
  ) lm on true
  left join lateral (
    select count(*) as cnt
    from messages m2
    where m2.conversation_id = cp.conversation_id
      and m2.sender_id != auth.uid()
      and m2.created_at > coalesce(cp.last_read_at, 'epoch'::timestamptz)
  ) uc on true
  where cp.user_id = auth.uid()
  order by lm.created_at desc nulls last;
$$;

grant execute on function public.get_conversations() to authenticated;

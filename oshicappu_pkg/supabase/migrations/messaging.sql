-- ============================================================
-- Direct messaging: tables, RLS policies, and helper functions
-- Run this whole file in the Supabase SQL editor.
-- ============================================================

-- 1. Tables
-- ------------------------------------------------------------

create table public.conversations (
  id uuid not null default gen_random_uuid(),
  created_at timestamp with time zone default now(),
  constraint conversations_pkey primary key (id)
);

create table public.conversation_participants (
  conversation_id uuid not null,
  user_id uuid not null,
  created_at timestamp with time zone default now(),
  last_read_at timestamp with time zone,
  constraint conversation_participants_pkey primary key (conversation_id, user_id),
  constraint conversation_participants_conversation_id_fkey
    foreign key (conversation_id) references public.conversations(id) on delete cascade,
  constraint conversation_participants_user_id_fkey
    foreign key (user_id) references public.profiles(id) on delete cascade
);

create table public.messages (
  id uuid not null default gen_random_uuid(),
  conversation_id uuid not null,
  sender_id uuid not null,
  content text not null,
  created_at timestamp with time zone default now(),
  constraint messages_pkey primary key (id),
  constraint messages_conversation_id_fkey
    foreign key (conversation_id) references public.conversations(id) on delete cascade,
  constraint messages_sender_id_fkey
    foreign key (sender_id) references public.profiles(id) on delete cascade
);

create index messages_conversation_id_created_at_idx
  on public.messages (conversation_id, created_at);

create index conversation_participants_user_id_idx
  on public.conversation_participants (user_id);


-- 2. Row Level Security
-- ------------------------------------------------------------

alter table public.conversations enable row level security;
alter table public.conversation_participants enable row level security;
alter table public.messages enable row level security;

-- Conversations: visible if you're a participant
create policy "Participants can view their conversations"
on public.conversations for select
using (
  id in (
    select conversation_id from public.conversation_participants
    where user_id = auth.uid()
  )
);

-- Conversation participants: visible if you share the conversation
create policy "Participants can view conversation participants"
on public.conversation_participants for select
using (
  conversation_id in (
    select conversation_id from public.conversation_participants
    where user_id = auth.uid()
  )
);

-- Conversation participants: you can only update your own row
-- (used for marking a conversation as read)
create policy "Users can update their own participant row"
on public.conversation_participants for update
using (user_id = auth.uid())
with check (user_id = auth.uid());

-- Messages: visible if you're a participant in that conversation
create policy "Participants can view messages in their conversations"
on public.messages for select
using (
  conversation_id in (
    select conversation_id from public.conversation_participants
    where user_id = auth.uid()
  )
);

-- Messages: you can only send as yourself, into conversations
-- you're actually part of
create policy "Participants can send messages in their conversations"
on public.messages for insert
with check (
  sender_id = auth.uid()
  and conversation_id in (
    select conversation_id from public.conversation_participants
    where user_id = auth.uid()
  )
);


-- 3. Helper functions
-- ------------------------------------------------------------

-- Finds (or creates) the 1:1 conversation between the current
-- user and another user, and returns its id. Runs as SECURITY
-- DEFINER so it can insert both participant rows atomically
-- without needing a broader "insert anyone" RLS policy.
create or replace function public.get_or_create_conversation(other_user_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  convo_id uuid;
begin
  if other_user_id = auth.uid() then
    raise exception 'Cannot start a conversation with yourself';
  end if;

  select cp1.conversation_id into convo_id
  from conversation_participants cp1
  join conversation_participants cp2
    on cp1.conversation_id = cp2.conversation_id
  where cp1.user_id = auth.uid()
    and cp2.user_id = other_user_id
    and (
      select count(*) from conversation_participants cp3
      where cp3.conversation_id = cp1.conversation_id
    ) = 2
  limit 1;

  if convo_id is not null then
    return convo_id;
  end if;

  insert into conversations default values returning id into convo_id;

  insert into conversation_participants (conversation_id, user_id)
  values (convo_id, auth.uid()), (convo_id, other_user_id);

  return convo_id;
end;
$$;

grant execute on function public.get_or_create_conversation(uuid) to authenticated;

-- Returns one row per conversation the current user is in, with
-- the other participant's profile info, the last message, and
-- an unread count -- everything the inbox screen needs in one call.
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
    lm.content as last_message,
    lm.created_at as last_message_at,
    coalesce(uc.cnt, 0)::integer as unread_count
  from conversation_participants cp
  join conversation_participants other_cp
    on other_cp.conversation_id = cp.conversation_id
    and other_cp.user_id != auth.uid()
  join profiles other
    on other.id = other_cp.user_id
  left join lateral (
    select content, created_at
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

-- Total unread message count across all conversations, for a
-- small badge (e.g. on a nav icon).
create or replace function public.get_unread_message_count()
returns integer
language sql
security invoker
as $$
  select coalesce(sum(cnt), 0)::integer
  from (
    select count(*) as cnt
    from public.messages m
    join public.conversation_participants cp
      on cp.conversation_id = m.conversation_id
      and cp.user_id = auth.uid()
    where m.sender_id != auth.uid()
      and m.created_at > coalesce(cp.last_read_at, 'epoch'::timestamptz)
    group by m.conversation_id
  ) sub;
$$;

grant execute on function public.get_unread_message_count() to authenticated;


-- 4. Realtime
-- ------------------------------------------------------------
-- Lets the chat screen receive new messages live without polling.

alter publication supabase_realtime add table public.messages;

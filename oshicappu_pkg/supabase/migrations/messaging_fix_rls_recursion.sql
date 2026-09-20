-- ============================================================
-- Fixes "infinite recursion detected in policy for relation
-- conversation_participants".
--
-- Cause: the SELECT policies checked membership by querying
-- conversation_participants from inside its own policy (and from
-- the conversations/messages policies), which re-triggers the
-- same policy on every recursive call.
--
-- Fix: move the membership check into a SECURITY DEFINER
-- function, which runs with elevated privileges and therefore
-- does not re-apply RLS to its internal query. Policies now call
-- this function instead of querying the table directly.
--
-- Run this in the Supabase SQL editor, after messaging.sql and
-- messaging_media.sql.
-- ============================================================

create or replace function public.is_conversation_participant(
  target_conversation_id uuid
)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from conversation_participants
    where conversation_participants.conversation_id = target_conversation_id
      and conversation_participants.user_id = auth.uid()
  );
$$;

grant execute on function public.is_conversation_participant(uuid) to authenticated;


-- Conversations
drop policy if exists "Participants can view their conversations" on public.conversations;

create policy "Participants can view their conversations"
on public.conversations for select
using (public.is_conversation_participant(id));


-- Conversation participants
drop policy if exists "Participants can view conversation participants" on public.conversation_participants;

create policy "Participants can view conversation participants"
on public.conversation_participants for select
using (public.is_conversation_participant(conversation_id));

-- (The "Users can update their own participant row" policy is
-- unaffected -- it only checks user_id = auth.uid() and never
-- queries the table it protects, so it doesn't recurse.)


-- Messages
drop policy if exists "Participants can view messages in their conversations" on public.messages;

create policy "Participants can view messages in their conversations"
on public.messages for select
using (public.is_conversation_participant(conversation_id));

drop policy if exists "Participants can send messages in their conversations" on public.messages;

create policy "Participants can send messages in their conversations"
on public.messages for insert
with check (
  sender_id = auth.uid()
  and public.is_conversation_participant(conversation_id)
);

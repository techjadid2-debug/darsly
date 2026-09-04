-- Anonymous players cannot UPDATE `activities` (RLS restricts writes to the
-- owner), so the play counter goes through a SECURITY DEFINER function that
-- can only ever do this one thing, and only on a public activity.
create or replace function public.increment_play_count(p_activity_id uuid)
returns void
language sql
security definer
set search_path = ''
as $$
  update public.activities
     set play_count = play_count + 1
   where id = p_activity_id
     and is_public = true;
$$;

revoke all on function public.increment_play_count(uuid) from public;
grant execute on function public.increment_play_count(uuid) to anon, authenticated;

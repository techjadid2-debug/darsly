-- Fixes three Supabase security-linter warnings raised against 0001:
--   * set_updated_at had a role-mutable search_path
--   * handle_new_user (SECURITY DEFINER) was callable as an RPC by anon and authenticated
-- Trigger functions are invoked by the trigger as the table owner, so no role
-- needs EXECUTE on them.

create or replace function public.set_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin
  if (to_jsonb(new) - 'play_count' - 'updated_at')
     is distinct from
     (to_jsonb(old) - 'play_count' - 'updated_at')
  then new.updated_at = now();
  else new.updated_at = old.updated_at;
  end if;
  return new;
end $$;

revoke all on function public.set_updated_at()  from public, anon, authenticated;
revoke all on function public.handle_new_user() from public, anon, authenticated;

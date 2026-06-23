-- Self-service account deletion.
--
-- Lets a signed-in user delete their OWN account from the client. It runs as the
-- function owner (postgres) via SECURITY DEFINER so it can remove the row from
-- auth.users; every user-owned table references auth.users(id) ON DELETE CASCADE
-- (see 001_initial_schema.sql), so the user's data is cleared with it. Deleting
-- the auth row also frees the email address for reuse.
--
-- auth.uid() scopes the delete to the caller, so a user can only ever delete
-- themselves. Execute is granted to `authenticated` (which includes anonymous
-- sessions), and revoked from everyone else.

create or replace function public.delete_user()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  delete from auth.users where id = auth.uid();
end;
$$;

revoke all on function public.delete_user() from public, anon;
grant execute on function public.delete_user() to authenticated;

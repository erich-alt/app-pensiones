create table if not exists public.alimentab_state (
  user_id uuid primary key references auth.users(id) on delete cascade,
  config jsonb not null default '{}'::jsonb,
  pagos jsonb not null default '[]'::jsonb,
  causas jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.alimentab_state enable row level security;

drop policy if exists "alimentab_select_own_state" on public.alimentab_state;
create policy "alimentab_select_own_state"
on public.alimentab_state
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "alimentab_insert_own_state" on public.alimentab_state;
create policy "alimentab_insert_own_state"
on public.alimentab_state
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "alimentab_update_own_state" on public.alimentab_state;
create policy "alimentab_update_own_state"
on public.alimentab_state
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "alimentab_delete_own_state" on public.alimentab_state;
create policy "alimentab_delete_own_state"
on public.alimentab_state
for delete
to authenticated
using (auth.uid() = user_id);

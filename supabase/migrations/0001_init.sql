-- profiles: extiende auth.users
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'free' check (role in ('free','premium')),
  created_at timestamptz default now()
);

-- temas: catálogo
create table public.temas (
  id serial primary key,
  slug text unique not null,
  parte text not null check (parte in ('general','especifica')),
  numero int not null,
  titulo text not null,
  published boolean not null default false,
  preview_for_free boolean not null default false,
  orden int not null
);

-- RLS
alter table public.profiles enable row level security;
alter table public.temas enable row level security;

-- profiles: el usuario solo ve y modifica el suyo
create policy "own_profile_select" on public.profiles
  for select using (auth.uid() = id);
create policy "own_profile_update" on public.profiles
  for update using (auth.uid() = id);

-- temas: lectura pública del catálogo (solo metadata, no contenido)
create policy "temas_read_all" on public.temas
  for select using (true);

-- Trigger: crear profile automáticamente al registrarse
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id) values (new.id);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

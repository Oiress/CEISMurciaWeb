-- annotations: notas + subrayados
create table public.annotations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  tema_id int references public.temas(id) on delete cascade not null,
  paragraph_id text not null,
  type text not null check (type in ('note','highlight')),
  content text,
  color text check (color in ('yellow','green','pink','blue')),
  range_start int,
  range_end int,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index annotations_user_tema_idx on public.annotations (user_id, tema_id);
create index annotations_paragraph_idx on public.annotations (user_id, tema_id, paragraph_id);

-- summaries: resumen propio por tema
create table public.summaries (
  user_id uuid references public.profiles(id) on delete cascade,
  tema_id int references public.temas(id) on delete cascade,
  content text not null default '',
  updated_at timestamptz default now(),
  primary key (user_id, tema_id)
);

-- drawings: trazos canvas por tema
create table public.drawings (
  user_id uuid references public.profiles(id) on delete cascade,
  tema_id int references public.temas(id) on delete cascade,
  strokes jsonb not null default '[]',
  updated_at timestamptz default now(),
  primary key (user_id, tema_id)
);

-- progress: por dónde iba el usuario
create table public.progress (
  user_id uuid references public.profiles(id) on delete cascade,
  tema_id int references public.temas(id) on delete cascade,
  scroll_percent numeric default 0 check (scroll_percent >= 0 and scroll_percent <= 100),
  last_paragraph_id text,
  last_visited_at timestamptz default now(),
  primary key (user_id, tema_id)
);

-- RLS
alter table public.annotations enable row level security;
alter table public.summaries enable row level security;
alter table public.drawings enable row level security;
alter table public.progress enable row level security;

create policy "own_annotations_all" on public.annotations
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own_summaries_all" on public.summaries
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own_drawings_all" on public.drawings
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own_progress_all" on public.progress
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

create trigger annotations_set_updated_at
  before update on public.annotations
  for each row execute function public.set_updated_at();
create trigger summaries_set_updated_at
  before update on public.summaries
  for each row execute function public.set_updated_at();
create trigger drawings_set_updated_at
  before update on public.drawings
  for each row execute function public.set_updated_at();

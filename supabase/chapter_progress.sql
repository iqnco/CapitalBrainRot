create table if not exists chapter_progress (
  user_id    uuid    references auth.users(id) on delete cascade,
  chapter_id text    not null,
  stars      integer not null default 0,
  completed  boolean not null default false,
  updated_at timestamptz not null default now(),
  primary key (user_id, chapter_id)
);

alter table chapter_progress enable row level security;

create policy "Users manage own chapter progress"
  on chapter_progress for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);

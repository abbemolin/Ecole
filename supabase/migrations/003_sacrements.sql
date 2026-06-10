create table sacrements (
  id           uuid primary key default uuid_generate_v4(),
  student_id   uuid references students(id) on delete cascade not null,
  type         text not null check (type in ('bapteme','communion','profession_de_foi')),
  status       text not null default 'demande' check (status in ('demande','en_preparation','recu')),
  date_request date default current_date,
  date_planned date,
  notes        text,
  created_at   timestamptz default now(),
  unique (student_id, type)
);
create index on sacrements(student_id);
create index on sacrements(type);
alter table sacrements enable row level security;
create policy "Anon read sacrements"   on sacrements for select to anon using (true);
create policy "Anon manage sacrements" on sacrements for all    to anon using (true);
create policy "Auth read sacrements"   on sacrements for select to authenticated using (true);
create policy "Auth manage sacrements" on sacrements for all    to authenticated using (true);

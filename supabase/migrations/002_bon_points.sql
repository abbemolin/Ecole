create table bon_points (
  id         uuid primary key default uuid_generate_v4(),
  student_id uuid references students(id) on delete cascade not null,
  amount     integer not null default 1,  -- positif ou négatif
  reason     text,
  date       date not null default current_date,
  created_at timestamptz default now()
);

create index on bon_points(student_id);
create index on bon_points(date);

alter table bon_points enable row level security;

create policy "Authenticated users can read bon_points"
  on bon_points for select to authenticated using (true);
create policy "Authenticated users can manage bon_points"
  on bon_points for all to authenticated using (true);

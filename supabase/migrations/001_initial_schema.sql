-- ============================================================
-- Schéma initial — Application Suivi Élèves
-- Écoles : Herrade de Landsberg / Saints Louis et Zélie Martin
-- ============================================================

-- Extension UUID
create extension if not exists "uuid-ossp";

-- ─── ÉCOLES ──────────────────────────────────────────────────
create table schools (
  id         uuid primary key default uuid_generate_v4(),
  name       text not null,
  created_at timestamptz default now()
);

-- Données initiales
insert into schools (name) values
  ('Herrade de Landsberg'),
  ('Collège Saints Louis et Zélie Martin');

-- ─── ÉLÈVES ──────────────────────────────────────────────────
create table students (
  id         uuid primary key default uuid_generate_v4(),
  school_id  uuid references schools(id) on delete cascade not null,
  first_name text not null,
  last_name  text not null,
  birth_date date,
  class      text,           -- ex: "6ème A", "CM2"
  created_at timestamptz default now()
);

create index on students(school_id);
create index on students(last_name);

-- ─── PARENTS / CONTACTS ──────────────────────────────────────
create table parents (
  id           uuid primary key default uuid_generate_v4(),
  student_id   uuid references students(id) on delete cascade not null,
  first_name   text not null,
  last_name    text not null,
  relationship text,         -- "père", "mère", "tuteur"…
  email        text,
  phone        text,
  created_at   timestamptz default now()
);

create index on parents(student_id);

-- ─── NOTES ───────────────────────────────────────────────────
create table grades (
  id          uuid primary key default uuid_generate_v4(),
  student_id  uuid references students(id) on delete cascade not null,
  subject     text not null,
  value       numeric(5,2) not null check (value >= 0 and value <= 20),
  coefficient numeric(4,2) not null default 1,
  date        date,
  term        text not null,  -- "Trimestre 1" | "Trimestre 2" | "Trimestre 3"
  comment     text,
  created_at  timestamptz default now()
);

create index on grades(student_id);
create index on grades(term);

-- ─── PRÉSENCES ───────────────────────────────────────────────
create type attendance_status as enum ('present', 'absent', 'late', 'excused');

create table attendance (
  id         uuid primary key default uuid_generate_v4(),
  student_id uuid references students(id) on delete cascade not null,
  date       date not null,
  status     attendance_status not null default 'present',
  reason     text,
  created_at timestamptz default now(),
  unique (student_id, date)
);

create index on attendance(student_id);
create index on attendance(date);

-- ─── APPRÉCIATIONS ───────────────────────────────────────────
create table comments (
  id         uuid primary key default uuid_generate_v4(),
  student_id uuid references students(id) on delete cascade not null,
  term       text not null,
  text       text not null,
  author     text,
  created_at timestamptz default now()
);

create index on comments(student_id);
create index on comments(term);

-- ─── ROW LEVEL SECURITY ──────────────────────────────────────
-- Activer RLS sur toutes les tables
alter table schools    enable row level security;
alter table students   enable row level security;
alter table parents    enable row level security;
alter table grades     enable row level security;
alter table attendance enable row level security;
alter table comments   enable row level security;

-- Politiques de lecture pour les utilisateurs authentifiés
-- (à affiner selon les rôles : admin, enseignant, etc.)
create policy "Authenticated users can read schools"
  on schools for select to authenticated using (true);

create policy "Authenticated users can read students"
  on students for select to authenticated using (true);

create policy "Authenticated users can manage students"
  on students for all to authenticated using (true);

create policy "Authenticated users can read parents"
  on parents for select to authenticated using (true);

create policy "Authenticated users can manage parents"
  on parents for all to authenticated using (true);

create policy "Authenticated users can read grades"
  on grades for select to authenticated using (true);

create policy "Authenticated users can manage grades"
  on grades for all to authenticated using (true);

create policy "Authenticated users can read attendance"
  on attendance for select to authenticated using (true);

create policy "Authenticated users can manage attendance"
  on attendance for all to authenticated using (true);

create policy "Authenticated users can read comments"
  on comments for select to authenticated using (true);

create policy "Authenticated users can manage comments"
  on comments for all to authenticated using (true);

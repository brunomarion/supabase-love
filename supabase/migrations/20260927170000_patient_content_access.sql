-- Controle de acesso individual de conteúdos e documentos dos pacientes
create table if not exists public.patient_exercise_access (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  exercise_id uuid not null references public.exercises(id) on delete cascade,
  physiotherapist_id uuid not null references public.physiotherapists(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(patient_id, exercise_id)
);

create table if not exists public.patient_pdf_access (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  pdf_material_id uuid not null references public.pdf_materials(id) on delete cascade,
  physiotherapist_id uuid not null references public.physiotherapists(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(patient_id, pdf_material_id)
);

create table if not exists public.patient_documents (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  physiotherapist_id uuid not null references public.physiotherapists(id) on delete cascade,
  file_name text not null,
  storage_path text not null,
  mime_type text,
  file_size bigint,
  created_at timestamptz not null default now()
);

alter table public.patient_exercise_access enable row level security;
alter table public.patient_pdf_access enable row level security;
alter table public.patient_documents enable row level security;

drop policy if exists "physio manages patient exercise access" on public.patient_exercise_access;
create policy "physio manages patient exercise access" on public.patient_exercise_access for all using (public.is_physiotherapist_owner(physiotherapist_id)) with check (public.is_physiotherapist_owner(physiotherapist_id));

drop policy if exists "physio manages patient pdf access" on public.patient_pdf_access;
create policy "physio manages patient pdf access" on public.patient_pdf_access for all using (public.is_physiotherapist_owner(physiotherapist_id)) with check (public.is_physiotherapist_owner(physiotherapist_id));

drop policy if exists "physio manages patient documents" on public.patient_documents;
create policy "physio manages patient documents" on public.patient_documents for all using (public.is_physiotherapist_owner(physiotherapist_id)) with check (public.is_physiotherapist_owner(physiotherapist_id));

insert into storage.buckets (id, name, public)
values ('patient-documents', 'patient-documents', false)
on conflict (id) do nothing;

drop policy if exists "physio patient document storage" on storage.objects;
create policy "physio patient document storage" on storage.objects for all
using (
  bucket_id = 'patient-documents'
  and (storage.foldername(name))[1] in (
    select p.id::text
    from public.physiotherapists p
    where p.user_id = auth.uid()
  )
)
with check (
  bucket_id = 'patient-documents'
  and (storage.foldername(name))[1] in (
    select p.id::text
    from public.physiotherapists p
    where p.user_id = auth.uid()
  )
);

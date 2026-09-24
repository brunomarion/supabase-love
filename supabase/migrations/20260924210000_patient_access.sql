-- Acesso individual do paciente a vídeos, PDFs e documentos
create table if not exists public.patient_exercises (
  patient_id uuid not null references public.patients(id) on delete cascade,
  exercise_id uuid not null references public.exercises(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (patient_id, exercise_id)
);

create table if not exists public.patient_pdf_materials (
  patient_id uuid not null references public.patients(id) on delete cascade,
  pdf_material_id uuid not null references public.pdf_materials(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (patient_id, pdf_material_id)
);

create table if not exists public.patient_documents (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  physiotherapist_id uuid not null references public.physiotherapists(id) on delete cascade,
  name text not null,
  file_name text not null,
  storage_path text not null,
  mime_type text,
  file_size bigint,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists patient_exercises_patient_id_idx on public.patient_exercises(patient_id);
create index if not exists patient_exercises_exercise_id_idx on public.patient_exercises(exercise_id);
create index if not exists patient_pdf_materials_patient_id_idx on public.patient_pdf_materials(patient_id);
create index if not exists patient_pdf_materials_pdf_id_idx on public.patient_pdf_materials(pdf_material_id);
create index if not exists patient_documents_patient_id_idx on public.patient_documents(patient_id);\ncreate unique index if not exists patients_cpf_unique on public.patients(cpf) where cpf is not null;

alter table public.patient_exercises enable row level security;
alter table public.patient_pdf_materials enable row level security;
alter table public.patient_documents enable row level security;

drop policy if exists "Fisioterapeuta gerencia exercícios dos pacientes" on public.patient_exercises;
create policy "Fisioterapeuta gerencia exercícios dos pacientes"
on public.patient_exercises for all to authenticated
using (exists (
  select 1 from public.patients p
  join public.physiotherapists f on f.id = p.physiotherapist_id
  join public.exercises e on e.id = patient_exercises.exercise_id
  where p.id = patient_exercises.patient_id and f.user_id = auth.uid() and e.physiotherapist_id = f.id
))
with check (exists (
  select 1 from public.patients p
  join public.physiotherapists f on f.id = p.physiotherapist_id
  join public.exercises e on e.id = patient_exercises.exercise_id
  where p.id = patient_exercises.patient_id and f.user_id = auth.uid() and e.physiotherapist_id = f.id
));

drop policy if exists "Paciente visualiza seus exercícios" on public.patient_exercises;
create policy "Paciente visualiza seus exercícios"
on public.patient_exercises for select to authenticated
using (exists (
  select 1 from public.patients p
  where p.id = patient_exercises.patient_id and p.auth_user_id = auth.uid() and p.status = 'active'
));

drop policy if exists "Fisioterapeuta gerencia PDFs dos pacientes" on public.patient_pdf_materials;
create policy "Fisioterapeuta gerencia PDFs dos pacientes"
on public.patient_pdf_materials for all to authenticated
using (exists (
  select 1 from public.patients p
  join public.physiotherapists f on f.id = p.physiotherapist_id
  join public.pdf_materials m on m.id = patient_pdf_materials.pdf_material_id
  where p.id = patient_pdf_materials.patient_id and f.user_id = auth.uid() and m.physiotherapist_id = f.id
))
with check (exists (
  select 1 from public.patients p
  join public.physiotherapists f on f.id = p.physiotherapist_id
  join public.pdf_materials m on m.id = patient_pdf_materials.pdf_material_id
  where p.id = patient_pdf_materials.patient_id and f.user_id = auth.uid() and m.physiotherapist_id = f.id
));

drop policy if exists "Paciente visualiza seus PDFs" on public.patient_pdf_materials;
create policy "Paciente visualiza seus PDFs"
on public.patient_pdf_materials for select to authenticated
using (exists (
  select 1 from public.patients p
  where p.id = patient_pdf_materials.patient_id and p.auth_user_id = auth.uid() and p.status = 'active'
));

drop policy if exists "Fisioterapeuta gerencia documentos dos pacientes" on public.patient_documents;
create policy "Fisioterapeuta gerencia documentos dos pacientes"
on public.patient_documents for all to authenticated
using (exists (
  select 1 from public.patients p
  join public.physiotherapists f on f.id = p.physiotherapist_id
  where p.id = patient_documents.patient_id and f.id = patient_documents.physiotherapist_id and f.user_id = auth.uid()
))
with check (exists (
  select 1 from public.patients p
  join public.physiotherapists f on f.id = p.physiotherapist_id
  where p.id = patient_documents.patient_id and f.id = patient_documents.physiotherapist_id and f.user_id = auth.uid()
));

drop policy if exists "Paciente visualiza seus documentos" on public.patient_documents;
create policy "Paciente visualiza seus documentos"
on public.patient_documents for select to authenticated
using (exists (
  select 1 from public.patients p
  where p.id = patient_documents.patient_id and p.auth_user_id = auth.uid() and p.status = 'active'
));

drop policy if exists "Paciente visualiza exercícios atribuídos" on public.exercises;
create policy "Paciente visualiza exercícios atribuídos"
on public.exercises for select to authenticated
using (exists (
  select 1 from public.patient_exercises pe
  join public.patients p on p.id = pe.patient_id
  where pe.exercise_id = exercises.id and p.auth_user_id = auth.uid() and p.status = 'active'
));

drop policy if exists "Paciente visualiza PDFs atribuídos" on public.pdf_materials;
create policy "Paciente visualiza PDFs atribuídos"
on public.pdf_materials for select to authenticated
using (exists (
  select 1 from public.patient_pdf_materials pm
  join public.patients p on p.id = pm.patient_id
  where pm.pdf_material_id = pdf_materials.id and p.auth_user_id = auth.uid() and p.status = 'active'
));

drop policy if exists "Paciente visualiza seu próprio cadastro" on public.patients;
create policy "Paciente visualiza seu próprio cadastro"
on public.patients for select to authenticated
using (auth_user_id = auth.uid());

drop policy if exists "Usuários autenticados podem visualizar PDFs" on storage.objects;\n\ninsert into storage.buckets (id, name, public)
values ('patient-documents', 'patient-documents', false)
on conflict (id) do update set public = false;

drop policy if exists "Fisioterapeuta gerencia arquivos de pacientes" on storage.objects;
create policy "Fisioterapeuta gerencia arquivos de pacientes"
on storage.objects for all to authenticated
using (
  bucket_id = 'patient-documents' and exists (
    select 1 from public.patients p
    join public.physiotherapists f on f.id = p.physiotherapist_id
    where p.id::text = (storage.foldername(name))[1] and f.user_id = auth.uid()
  )
)
with check (
  bucket_id = 'patient-documents' and exists (
    select 1 from public.patients p
    join public.physiotherapists f on f.id = p.physiotherapist_id
    where p.id::text = (storage.foldername(name))[1] and f.user_id = auth.uid()
  )
);

drop policy if exists "Paciente visualiza seus arquivos" on storage.objects;
create policy "Paciente visualiza seus arquivos"
on storage.objects for select to authenticated
using (
  bucket_id = 'patient-documents' and exists (
    select 1 from public.patients p
    where p.id::text = (storage.foldername(name))[1] and p.auth_user_id = auth.uid() and p.status = 'active'
  )
);

-- Nome personalizado dos documentos exibido ao paciente
alter table public.patient_documents
  add column if not exists display_name text;

update public.patient_documents
set display_name = file_name
where display_name is null or btrim(display_name) = '';

alter table public.patient_documents
  alter column display_name set default '';


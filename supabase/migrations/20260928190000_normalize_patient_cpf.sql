-- Padroniza os CPFs dos pacientes para o mesmo formato usado no login: somente números.
update public.patients
set cpf = regexp_replace(coalesce(cpf, ''), '[^0-9]', '', 'g')
where cpf is not null;

create index if not exists patients_cpf_idx on public.patients (cpf);

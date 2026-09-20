ALTER TABLE public.patients
  ADD COLUMN IF NOT EXISTS cep text,
  ADD COLUMN IF NOT EXISTS street text,
  ADD COLUMN IF NOT EXISTS number text,
  ADD COLUMN IF NOT EXISTS complement text,
  ADD COLUMN IF NOT EXISTS neighborhood text,
  ADD COLUMN IF NOT EXISTS city text,
  ADD COLUMN IF NOT EXISTS state text;

COMMENT ON COLUMN public.patients.cep IS 'CEP do endereço residencial do paciente.';
COMMENT ON COLUMN public.patients.street IS 'Rua/logradouro do endereço do paciente.';
COMMENT ON COLUMN public.patients.number IS 'Número do endereço do paciente.';
COMMENT ON COLUMN public.patients.complement IS 'Complemento do endereço do paciente.';
COMMENT ON COLUMN public.patients.neighborhood IS 'Bairro do endereço do paciente.';
COMMENT ON COLUMN public.patients.city IS 'Cidade do endereço do paciente.';
COMMENT ON COLUMN public.patients.state IS 'Estado/UF do endereço do paciente.';

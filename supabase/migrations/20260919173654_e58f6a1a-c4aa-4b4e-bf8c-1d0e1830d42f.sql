CREATE TABLE public.physiotherapists (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL UNIQUE,
  full_name text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  role text NOT NULL DEFAULT 'admin',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.physiotherapists TO authenticated;
GRANT ALL ON public.physiotherapists TO service_role;

ALTER TABLE public.physiotherapists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Fisioterapeuta ve o proprio cadastro"
  ON public.physiotherapists FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Fisioterapeuta atualiza o proprio cadastro"
  ON public.physiotherapists FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_physiotherapists_updated_at
BEFORE UPDATE ON public.physiotherapists
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.handle_new_physiotherapist()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.physiotherapists (user_id, full_name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', ''),
    COALESCE(NEW.email, ''),
    'admin'
  )
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created_physiotherapist
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_physiotherapist();
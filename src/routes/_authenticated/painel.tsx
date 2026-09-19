import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { signOut } from "@/lib/auth";
import logo from "@/assets/logo-erick-paulino.jpg.asset.json";

export const Route = createFileRoute("/_authenticated/painel")({
  head: () => ({
    meta: [
      { title: "Painel | Erick Paulino Fisioterapia" },
      {
        name: "description",
        content: "Área restrita do fisioterapeuta na plataforma Erick Paulino.",
      },
      { property: "og:title", content: "Painel | Erick Paulino Fisioterapia" },
      { property: "og:description", content: "Área restrita do fisioterapeuta." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: PainelPage,
});

function PainelPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: profile } = useQuery({
    queryKey: ["physiotherapist", "me"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("physiotherapists")
        .select("full_name, email, role")
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  async function handleSignOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await signOut();
    navigate({ to: "/", replace: true });
  }

  return (
    <main className="min-h-screen px-6 py-10 sm:px-12">
      <header className="flex items-center justify-between border-b pb-6">
        <img src={logo.url} alt="Erick Paulino Fisioterapeuta" className="w-40" />
        <Button variant="ghost" onClick={handleSignOut} className="rounded-none text-xs tracking-[0.2em] uppercase">
          Sair
        </Button>
      </header>

      <section className="mx-auto mt-24 max-w-lg text-center">
        <p className="eyebrow">Acesso confirmado</p>
        <h1 className="mt-4 font-display text-5xl font-light">Login realizado com sucesso.</h1>
        <p className="mt-4 text-sm text-muted-foreground">
          {profile?.full_name
            ? `Olá, ${profile.full_name}.`
            : "Seu painel do fisioterapeuta será construído aqui."}
        </p>
      </section>
    </main>
  );
}

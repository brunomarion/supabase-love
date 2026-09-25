import { createFileRoute, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { signOut } from "@/lib/auth";

export const Route = createFileRoute("/_authenticated/paciente")({
  head: () => ({
    meta: [
      { title: "Área do Paciente | Erick Paulino Fisioterapia" },
      { name: "robots", content: "noindex" },
    ],
  }),
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();

    if (error || !data.user) {
      throw redirect({ to: "/" });
    }

    if (data.user.user_metadata?.account_type !== "patient") {
      throw redirect({ to: "/painel" });
    }

    return { user: data.user };
  },
  component: PatientPage,
});

function PatientPage() {
  const { data: sessionData } = supabase.auth.onAuthStateChange(() => {});
  
  return (
    <main className="min-h-screen bg-[#fcfaf7] px-6 py-10 text-[#2d2823]">
      <div className="mx-auto max-w-5xl">
        <header className="rounded-3xl border border-[#e6d8c5] bg-white p-8 shadow-[0_18px_50px_rgba(64,48,30,0.08)]">
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-[#ba9051]">
            Área do paciente
          </p>
          <h1 className="mt-2 text-3xl font-semibold">
            Bem-vindo!
          </h1>
          <p className="mt-2 text-[#746c64]">
            Aqui você poderá acompanhar seus exercícios, vídeos e materiais
            disponibilizados pelo seu fisioterapeuta.
          </p>
          <button
            type="button"
            onClick={() => signOut()}
            className="mt-6 rounded-xl bg-[#ba9051] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#a98148]"
          >
            Sair
          </button>
        </header>
      </div>
    </main>
  );
}

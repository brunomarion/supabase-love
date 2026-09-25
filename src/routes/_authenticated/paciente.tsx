import { useEffect, useState } from "react";
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { Dumbbell, FileText, Home, LogOut, Menu, X } from "lucide-react";
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

type PatientTab = "dashboard" | "exercicios" | "documentos";

const nav: { id: PatientTab; label: string; icon: typeof Home }[] = [
  { id: "dashboard", label: "Painel", icon: Home },
  { id: "exercicios", label: "Exercícios", icon: Dumbbell },
  { id: "documentos", label: "Documentos", icon: FileText },
];

function PatientPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<PatientTab>("dashboard");
  const [menuOpen, setMenuOpen] = useState(false);
  const [patientName, setPatientName] = useState("Paciente");

  useEffect(() => {
    let mounted = true;

    void supabase.auth.getUser().then(({ data }) => {
      if (!mounted || !data.user) return;
      const name = data.user.user_metadata?.full_name;
      if (typeof name === "string" && name.trim()) {
        setPatientName(name.trim());
      }
    });

    return () => {
      mounted = false;
    };
  }, []);

  async function logout() {
    await signOut();
    navigate({ to: "/", replace: true });
  }

  function selectTab(nextTab: PatientTab) {
    setTab(nextTab);
    setMenuOpen(false);
  }

  return (
    <main className="min-h-screen bg-[#f8f6f2] text-[#2d2823]">
      <div className="flex min-h-screen">
        <aside className="hidden w-[255px] shrink-0 border-r border-[#e6d8c5] bg-white lg:flex lg:flex-col">
          <div className="flex h-[92px] items-center justify-center border-b border-[#eee6dc] px-7">
            <img
              src="/images/logo-editada-chatgpt.png"
              alt="Erick Paulino Fisioterapia"
              className="h-auto max-h-16 w-full object-contain"
            />
          </div>

          <nav className="flex-1 space-y-2 px-4 py-7">
            {nav.map((item) => {
              const Icon = item.icon;
              const active = tab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => selectTab(item.id)}
                  className={`group flex w-full items-center gap-3 rounded-2xl px-4 py-3.5 text-left text-sm font-semibold transition-all duration-200 ${
                    active
                      ? "bg-[linear-gradient(135deg,#ba9051,#a97a3c)] text-white shadow-[0_10px_25px_rgba(169,122,60,0.24)]"
                      : "text-[#746c64] hover:bg-[#f7f0e7] hover:text-[#a97a3c]"
                  }`}
                >
                  <Icon className="size-[19px]" strokeWidth={1.8} />
                  {item.label}
                </button>
              );
            })}
          </nav>

          <div className="border-t border-[#eee6dc] p-4">
            <button
              type="button"
              onClick={() => void logout()}
              className="flex w-full items-center gap-3 rounded-2xl px-4 py-3.5 text-sm font-semibold text-[#746c64] transition hover:bg-[#f7f0e7] hover:text-[#a97a3c]"
            >
              <LogOut className="size-[19px]" strokeWidth={1.8} />
              Sair
            </button>
          </div>
        </aside>

        {menuOpen ? (
          <div className="fixed inset-0 z-50 bg-black/20 lg:hidden" onClick={() => setMenuOpen(false)}>
            <aside
              className="flex h-full w-[285px] flex-col border-r border-[#e6d8c5] bg-white shadow-[10px_0_40px_rgba(45,40,35,0.12)]"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex h-[88px] items-center justify-between border-b border-[#eee6dc] px-5">
                <img
                  src="/images/logo-editada-chatgpt.png"
                  alt="Erick Paulino Fisioterapia"
                  className="h-auto max-h-14 w-[190px] object-contain"
                />
                <button type="button" onClick={() => setMenuOpen(false)} className="rounded-xl p-2 text-[#746c64] hover:bg-[#f7f0e7]">
                  <X className="size-5" />
                </button>
              </div>

              <nav className="flex-1 space-y-2 px-4 py-6">
                {nav.map((item) => {
                  const Icon = item.icon;
                  const active = tab === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => selectTab(item.id)}
                      className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3.5 text-left text-sm font-semibold ${
                        active ? "bg-[linear-gradient(135deg,#ba9051,#a97a3c)] text-white shadow-[0_10px_25px_rgba(169,122,60,0.24)]" : "text-[#746c64] hover:bg-[#f7f0e7]"
                      }`}
                    >
                      <Icon className="size-[19px]" strokeWidth={1.8} />
                      {item.label}
                    </button>
                  );
                })}
              </nav>

              <div className="border-t border-[#eee6dc] p-4">
                <button type="button" onClick={() => void logout()} className="flex w-full items-center gap-3 rounded-2xl px-4 py-3.5 text-sm font-semibold text-[#746c64] hover:bg-[#f7f0e7]">
                  <LogOut className="size-[19px]" strokeWidth={1.8} />
                  Sair
                </button>
              </div>
            </aside>
          </div>
        ) : null}

        <section className="min-w-0 flex-1">
          <header className="sticky top-0 z-30 flex h-[76px] items-center justify-between border-b border-[#e6d8c5] bg-white/95 px-4 shadow-[0_4px_18px_rgba(45,40,35,0.04)] backdrop-blur md:px-7 lg:px-9">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setMenuOpen(true)}
                className="rounded-xl border border-[#e6d8c5] bg-white p-2.5 text-[#746c64] shadow-sm lg:hidden"
                aria-label="Abrir menu"
              >
                <Menu className="size-5" />
              </button>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#ba9051]">Área do paciente</p>
                <h1 className="text-lg font-semibold text-[#2d2823] md:text-xl">{nav.find((item) => item.id === tab)?.label}</h1>
              </div>
            </div>
            <div className="hidden items-center gap-3 rounded-2xl border border-[#e6d8c5] bg-[#fcfaf7] px-4 py-2.5 sm:flex">
              <div className="flex size-9 items-center justify-center rounded-full bg-[#f1e3d0] text-[#a97a3c]">
                <span className="text-sm font-bold">{patientName.charAt(0).toUpperCase()}</span>
              </div>
              <div className="max-w-[190px]">
                <p className="truncate text-sm font-semibold text-[#2d2823]">{patientName}</p>
                <p className="text-xs text-[#746c64]">Paciente</p>
              </div>
            </div>
          </header>

          <div className="mx-auto w-full max-w-[1450px] p-4 md:p-7 lg:p-9">
            {tab === "dashboard" && (
              <div className="space-y-7">
                <section className="rounded-[2rem] border border-[#e6d8c5] bg-[radial-gradient(circle_at_top_right,rgba(186,144,81,0.18),transparent_38%),linear-gradient(145deg,#ffffff_0%,#fcfaf7_52%,#f5eee4_100%)] p-6 shadow-[0_20px_55px_rgba(64,48,30,0.08)] md:p-9">
                  <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#ba9051]">Bem-vindo</p>
                  <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-[#2d2823] md:text-3xl">
                    Olá, {patientName.split(" ")[0]}!
                  </h2>
                  <p className="mt-3 max-w-2xl text-sm leading-6 text-[#746c64] md:text-base">
                    Acompanhe aqui seus exercícios e os documentos disponibilizados pelo seu fisioterapeuta.
                  </p>
                </section>

                <div className="grid gap-5 md:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => setTab("exercicios")}
                    className="group rounded-[1.7rem] border border-[#e6d8c5] bg-white p-6 text-left shadow-[0_14px_35px_rgba(64,48,30,0.06)] transition hover:-translate-y-1 hover:shadow-[0_18px_40px_rgba(64,48,30,0.10)]"
                  >
                    <span className="flex size-12 items-center justify-center rounded-2xl bg-[#f3e5d2] text-[#a97a3c]">
                      <Dumbbell className="size-6" strokeWidth={1.8} />
                    </span>
                    <h3 className="mt-5 text-lg font-semibold">Meus exercícios</h3>
                    <p className="mt-1 text-sm text-[#746c64]">Acesse os exercícios indicados para o seu tratamento.</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTab("documentos")}
                    className="group rounded-[1.7rem] border border-[#e6d8c5] bg-white p-6 text-left shadow-[0_14px_35px_rgba(64,48,30,0.06)] transition hover:-translate-y-1 hover:shadow-[0_18px_40px_rgba(64,48,30,0.10)]"
                  >
                    <span className="flex size-12 items-center justify-center rounded-2xl bg-[#f3e5d2] text-[#a97a3c]">
                      <FileText className="size-6" strokeWidth={1.8} />
                    </span>
                    <h3 className="mt-5 text-lg font-semibold">Meus documentos</h3>
                    <p className="mt-1 text-sm text-[#746c64]">Consulte os materiais disponibilizados para você.</p>
                  </button>
                </div>
              </div>
            )}

            {tab === "exercicios" && (
              <section className="rounded-[2rem] border border-[#e6d8c5] bg-white p-6 shadow-[0_18px_45px_rgba(64,48,30,0.07)] md:p-8">
                <div className="flex items-center gap-4">
                  <span className="flex size-12 items-center justify-center rounded-2xl bg-[#f3e5d2] text-[#a97a3c]">
                    <Dumbbell className="size-6" strokeWidth={1.8} />
                  </span>
                  <div>
                    <h2 className="text-2xl font-semibold">Exercícios</h2>
                    <p className="mt-1 text-sm text-[#746c64]">Seus exercícios serão exibidos aqui.</p>
                  </div>
                </div>
                <div className="mt-8 rounded-2xl border border-dashed border-[#d9c8b2] bg-[#fcfaf7] p-8 text-center text-sm text-[#746c64]">
                  Nenhum exercício disponível no momento.
                </div>
              </section>
            )}

            {tab === "documentos" && (
              <section className="rounded-[2rem] border border-[#e6d8c5] bg-white p-6 shadow-[0_18px_45px_rgba(64,48,30,0.07)] md:p-8">
                <div className="flex items-center gap-4">
                  <span className="flex size-12 items-center justify-center rounded-2xl bg-[#f3e5d2] text-[#a97a3c]">
                    <FileText className="size-6" strokeWidth={1.8} />
                  </span>
                  <div>
                    <h2 className="text-2xl font-semibold">Documentos</h2>
                    <p className="mt-1 text-sm text-[#746c64]">Seus materiais serão exibidos aqui.</p>
                  </div>
                </div>
                <div className="mt-8 rounded-2xl border border-dashed border-[#d9c8b2] bg-[#fcfaf7] p-8 text-center text-sm text-[#746c64]">
                  Nenhum documento disponível no momento.
                </div>
              </section>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

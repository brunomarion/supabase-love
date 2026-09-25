import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { Dumbbell, FileText, Home, LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { signOut } from "@/lib/auth";

const logo = "/images/logo-editada-chatgpt.png";

export const Route = createFileRoute("/_authenticated/paciente")({
  head: () => ({
    meta: [
      { title: "Painel | Erick Paulino Fisioterapia" },
      { name: "description", content: "Área exclusiva do paciente." },
      { name: "robots", content: "noindex" },
    ],
  }),
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/" });
    if (data.user.user_metadata?.account_type !== "patient") {
      throw redirect({ to: "/painel" });
    }
    return { user: data.user };
  },
  component: PatientPage,
});

type Tab = "dashboard" | "exercicios" | "documentos";

const nav: { id: Tab; label: string; icon: typeof Home }[] = [
  { id: "dashboard", label: "Painel", icon: Home },
  { id: "exercicios", label: "Exercícios", icon: Dumbbell },
  { id: "documentos", label: "Documentos", icon: FileText },
];

function PatientPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("dashboard");
  const [isFirstDashboardEntry, setIsFirstDashboardEntry] = useState(true);
  const [patientName, setPatientName] = useState("Paciente");
  const [confirmLogout, setConfirmLogout] = useState(false);

  useEffect(() => {
    void supabase.auth.getUser().then(({ data }) => {
      const name = data.user?.user_metadata?.full_name;
      if (typeof name === "string" && name.trim()) setPatientName(name.trim());
    });
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => setIsFirstDashboardEntry(false), 1400);
    return () => window.clearTimeout(timer);
  }, []);

  async function logout() {
    await signOut();
    setConfirmLogout(false);
    navigate({ to: "/", replace: true });
  }

  return (
    <main className={`h-screen overflow-hidden text-[#2D2823] lg:bg-[#faf8f4] ${tab === "dashboard" ? "bg-[linear-gradient(to_top,#c09a66_0%,#ffffff_78%,#ffffff_100%)]" : "bg-[#faf8f4]"}`}>
      <div className="flex min-h-screen">
        <aside className="hidden w-[250px] shrink-0 flex-col border-r border-[#E6D8C5] bg-white lg:flex">
          <div className="flex h-[92px] items-center justify-center border-b border-[#eee5d9] px-4">
            <img src={logo} alt="Erick Paulino Fisioterapeuta" className="h-full w-full object-contain" />
          </div>

          <nav className="flex-1 space-y-1 px-4 py-6">
            {nav.map(({ id, label, icon: Icon }) => (
              <button key={id} type="button" onClick={() => setTab(id)} data-active={tab === id ? "true" : "false"} className={`premium-tab-button flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-[13px] font-medium transition ${tab === id ? "bg-[#BA9051]/10 text-[#A97A3C] shadow-[inset_3px_0_0_#BA9051]" : "text-[#746C64] hover:bg-[#faf7f2] hover:text-[#2D2823]"}`}>
                <Icon className={tab === id ? "size-[18px] text-[#BA9051]" : "size-[18px] text-[#9b9084]"} strokeWidth={1.8} />{label}
              </button>
            ))}
          </nav>

          <div className="border-t border-[#eee5d9] p-4">
            <button type="button" onClick={() => setConfirmLogout(true)} className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm text-[#c94b4b] transition hover:bg-[#fff0f0] hover:text-[#b83d3d]">
              <LogOut className="size-[18px]" /> Sair
            </button>
          </div>
        </aside>

        <div className="min-w-0 flex-1 overflow-hidden pb-24 lg:pb-0">
          <header className={`sticky top-0 z-20 border-b border-[#eee5d9]/90 px-4 py-3 backdrop-blur-xl sm:px-6 lg:hidden ${tab === "dashboard" ? "bg-white" : "bg-[#faf8f4]/95"}`}>
            <div className="flex items-center justify-center lg:hidden">
              <img src={logo} alt="Erick Paulino Fisioterapia" className="h-auto w-[min(52vw,210px)] object-contain" />
              <button type="button" onClick={() => setConfirmLogout(true)} className="absolute right-4 top-3 flex items-center gap-2 rounded-xl border border-[#f0caca] bg-[#fff5f5] px-3 py-2 text-xs font-medium text-[#c94b4b] transition hover:border-[#e58a8a] hover:bg-[#fff0f0] hover:text-[#b83d3d]">
                <LogOut className="size-4" /> Sair
              </button>
            </div>
          </header>

          <div className="mx-auto h-full max-w-[1400px] overflow-hidden px-4 py-6 sm:px-6 sm:py-8 lg:px-10 lg:py-14">
            <motion.div key={tab} className="premium-tab-content" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.36, ease: "easeOut" }}>
              {tab === "dashboard" && (
                <Dashboard name={patientName} animateFirstEntry={isFirstDashboardEntry} />
              )}
              {tab === "exercicios" && (
                <Placeholder icon={Dumbbell} title="Exercícios" text="Aqui serão exibidos os exercícios disponibilizados pelo seu fisioterapeuta." />
              )}
              {tab === "documentos" && (
                <Placeholder icon={FileText} title="Documentos" text="Aqui serão exibidos os documentos disponibilizados pelo seu fisioterapeuta." />
              )}
            </motion.div>
          </div>
        </div>
      </div>

      <nav className="fixed inset-x-3 bottom-3 z-30 grid grid-cols-3 items-stretch gap-1 rounded-2xl border border-[#dfd0bb] bg-white/95 px-2 py-2 shadow-[0_14px_40px_rgba(64,48,30,0.16)] backdrop-blur-xl lg:hidden">
        {nav.map(({ id, label, icon: Icon }) => (
          <button key={id} type="button" onClick={() => setTab(id)} data-active={tab === id ? "true" : "false"} className={`premium-tab-button flex min-w-0 flex-col items-center justify-center gap-1 rounded-xl px-1 py-2 text-[9px] font-medium transition ${tab === id ? "bg-[#BA9051]/10 text-[#A97A3C]" : "text-[#8e857c] hover:bg-[#faf7f2]"}`}>
            <Icon className="size-[18px]" strokeWidth={1.8} /><span className="truncate">{label}</span>
          </button>
        ))}
      </nav>

      <AnimatePresence mode="wait">
        {confirmLogout && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.28, ease: "easeOut" }}
            className="premium-modal-backdrop fixed inset-0 z-[80] flex items-center justify-center bg-[#2D2823]/40 p-4 backdrop-blur-sm"
            onClick={(e) => e.target === e.currentTarget && setConfirmLogout(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.97, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: 8 }}
              transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
              className="w-full max-w-[410px] overflow-hidden rounded-[1.5rem] border border-[#e3d3bd] bg-white shadow-[0_25px_80px_rgba(64,48,30,0.24)]"
            >
              <div className="h-1.5 bg-[linear-gradient(90deg,#BA9051,#C69A59,#A97A3C)]" />
              <div className="p-6 sm:p-7">
                <div className="flex items-start gap-4">
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-[#f8f0e5] text-[#A97A3C]">
                    <LogOut className="size-5" />
                  </span>
                  <div className="min-w-0">
                    <h2 className="text-base font-semibold text-[#2D2823]">Deseja mesmo sair?</h2>
                    <p className="mt-3 text-xs leading-relaxed text-[#8a8178]">
                      Deseja mesmo sair do sistema? Você precisará fazer login novamente para acessar o sistema.
                    </p>
                  </div>
                </div>
                <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={() => setConfirmLogout(false)}
                    className="h-10 rounded-xl border border-[#e6d8c5] px-4 text-xs font-medium text-[#746C64]"
                  >
                    Continuar no sistema
                  </button>
                  <button
                    type="button"
                    onClick={() => void logout()}
                    className="flex h-10 items-center justify-center gap-2 rounded-xl bg-[#c94b4b] px-4 text-xs font-semibold text-white transition hover:bg-[#b83d3d]"
                  >
                    <LogOut className="size-4" />
                    Sim, sair do sistema
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}

function Dashboard({ name, animateFirstEntry }: { name: string; animateFirstEntry: boolean }) {
  return (
    <div className="space-y-8">
      <section className="rounded-[1.5rem] border border-[#E6D8C5] bg-white p-6 shadow-[0_10px_30px_rgba(64,48,30,0.06)] sm:p-8">
        <p className="text-xs font-medium uppercase tracking-[0.16em] text-[#BA9051]">Painel</p>
        <h1 className="mt-2 text-2xl font-semibold text-[#2D2823] sm:text-3xl">Olá, {name.split(" ")[0]}!</h1>
        <p className="mt-2 text-sm text-[#746C64]">Acompanhe aqui os conteúdos disponibilizados pelo seu fisioterapeuta.</p>
      </section>

      <div className="grid gap-5 md:grid-cols-2">
        <button type="button" className="rounded-[1.5rem] border border-[#E6D8C5] bg-white p-6 text-left shadow-[0_10px_30px_rgba(64,48,30,0.06)] transition hover:-translate-y-0.5 hover:shadow-[0_16px_35px_rgba(64,48,30,0.10)]">
          <Dumbbell className="size-6 text-[#BA9051]" strokeWidth={1.8} />
          <h2 className="mt-4 text-lg font-semibold">Exercícios</h2>
          <p className="mt-1 text-sm text-[#746C64]">Acesse os exercícios indicados para você.</p>
        </button>
        <button type="button" className="rounded-[1.5rem] border border-[#E6D8C5] bg-white p-6 text-left shadow-[0_10px_30px_rgba(64,48,30,0.06)] transition hover:-translate-y-0.5 hover:shadow-[0_16px_35px_rgba(64,48,30,0.10)]">
          <FileText className="size-6 text-[#BA9051]" strokeWidth={1.8} />
          <h2 className="mt-4 text-lg font-semibold">Documentos</h2>
          <p className="mt-1 text-sm text-[#746C64]">Consulte os materiais disponibilizados para você.</p>
        </button>
      </div>
    </div>
  );
}

function Placeholder({ icon: Icon, title, text }: { icon: typeof Home; title: string; text: string }) {
  return (
    <section className="rounded-[1.5rem] border border-[#E6D8C5] bg-white p-6 shadow-[0_10px_30px_rgba(64,48,30,0.06)] sm:p-8">
      <div className="flex items-center gap-4">
        <span className="flex size-12 items-center justify-center rounded-xl bg-[#BA9051]/10 text-[#A97A3C]">
          <Icon className="size-6" strokeWidth={1.8} />
        </span>
        <div>
          <h1 className="text-xl font-semibold text-[#2D2823] sm:text-2xl">{title}</h1>
          <p className="mt-1 text-sm text-[#746C64]">{text}</p>
        </div>
      </div>
    </section>
  );
}

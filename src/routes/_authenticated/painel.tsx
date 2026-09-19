import { useState, type FormEvent, type ReactNode } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Dumbbell, FileText, Home, LogOut, Plus, Settings, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { signOut } from "@/lib/auth";
import logo from "@/assets/logo-erick-paulino.jpg.asset.json";

export const Route = createFileRoute("/_authenticated/painel")({
  head: () => ({ meta: [
    { title: "Painel | Erick Paulino Fisioterapia" },
    { name: "description", content: "Painel administrativo do fisioterapeuta Erick Paulino." },
    { name: "robots", content: "noindex" },
  ]}),
  component: PainelPage,
});

type Tab = "dashboard" | "pacientes" | "exercicios" | "relatorios" | "configuracoes";
type Patient = { name: string; age: string; responsible: string };
type Exercise = { name: string; type: string; description: string };

const nav: { id: Tab; label: string; icon: typeof Home }[] = [
  { id: "dashboard", label: "Dashboard", icon: Home },
  { id: "pacientes", label: "Pacientes", icon: Users },
  { id: "exercicios", label: "Exercícios", icon: Dumbbell },
  { id: "relatorios", label: "Relatórios", icon: FileText },
  { id: "configuracoes", label: "Configurações", icon: Settings },
];

const initialPatients: Patient[] = [
  { name: "Miguel Oliveira", age: "8 meses", responsible: "Ana Oliveira" },
  { name: "Lívia Santos", age: "5 meses", responsible: "Mariana Santos" },
  { name: "Theo Almeida", age: "11 meses", responsible: "Carolina Almeida" },
];

const initialExercises: Exercise[] = [
  { name: "Estimulação cervical", type: "Vídeo", description: "Exercícios para estímulo do controle cervical." },
  { name: "Estimulação visual", type: "Vídeo", description: "Atividades para estímulo visual e acompanhamento do bebê." },
  { name: "Controle de tronco", type: "Vídeo", description: "Exercícios para fortalecimento e controle de tronco." },
];

function PainelPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("dashboard");
  const [patients, setPatients] = useState(initialPatients);
  const [exercises, setExercises] = useState(initialExercises);
  const [modal, setModal] = useState<"patient" | "exercise" | null>(null);
  const [patient, setPatient] = useState({ name: "", age: "", responsible: "" });
  const [exercise, setExercise] = useState({ name: "", type: "Vídeo", description: "" });

  async function logout() {
    await signOut();
    navigate({ to: "/", replace: true });
  }

  function addPatient(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!patient.name.trim()) return;
    setPatients((items) => [...items, {
      name: patient.name.trim(),
      age: patient.age.trim() || "Não informado",
      responsible: patient.responsible.trim() || "Não informado",
    }]);
    setPatient({ name: "", age: "", responsible: "" });
    setModal(null);
  }

  function addExercise(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!exercise.name.trim()) return;
    setExercises((items) => [...items, {
      name: exercise.name.trim(),
      type: exercise.type.trim() || "Vídeo",
      description: exercise.description.trim() || "Sem descrição.",
    }]);
    setExercise({ name: "", type: "Vídeo", description: "" });
    setModal(null);
  }

  return (
    <main className="min-h-screen bg-[#faf8f4] text-[#2D2823]">
      <div className="flex min-h-screen">
        <aside className="hidden w-[250px] shrink-0 flex-col border-r border-[#E6D8C5] bg-white lg:flex">
          <div className="flex h-[92px] items-center border-b border-[#eee5d9] px-7">
            <img src={logo.url} alt="Erick Paulino Fisioterapeuta" className="h-auto w-[148px] object-contain" />
          </div>
          <nav className="flex-1 space-y-1 px-4 py-6">
            {nav.map(({ id, label, icon: Icon }) => (
              <button key={id} type="button" onClick={() => setTab(id)}
                className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-[13px] font-medium transition ${
                  tab === id ? "bg-[#BA9051]/10 text-[#A97A3C] shadow-[inset_3px_0_0_#BA9051]" : "text-[#746C64] hover:bg-[#faf7f2] hover:text-[#2D2823]"
                }`}>
                <Icon className={tab === id ? "size-[18px] text-[#BA9051]" : "size-[18px] text-[#9b9084]"} strokeWidth={1.8} />
                {label}
              </button>
            ))}
          </nav>
          <div className="border-t border-[#eee5d9] p-4">
            <div className="mb-3 rounded-2xl bg-[linear-gradient(145deg,#fffdf9,#f6eee3)] p-4">
              <div className="flex items-center gap-3">
                <span className="flex size-9 items-center justify-center rounded-full bg-[#BA9051]/10 text-xs font-semibold text-[#A97A3C]">E</span>
                <div><p className="text-xs font-semibold text-[#403a35]">Erick Paulino</p><p className="mt-0.5 text-[10px] text-[#9a9188]">Fisioterapeuta</p></div>
              </div>
            </div>
            <button type="button" onClick={logout} className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm text-[#8a8178] transition hover:bg-[#faf7f2] hover:text-[#A97A3C]">
              <LogOut className="size-[18px]" /> Sair
            </button>
          </div>
        </aside>

        <div className="min-w-0 flex-1 pb-24 lg:pb-0">
          <header className="sticky top-0 z-20 border-b border-[#eee5d9]/90 bg-[#faf8f4]/95 px-4 py-4 backdrop-blur-xl sm:px-6 lg:px-10 lg:py-5">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#A97A3C]">Painel administrativo</span>
                <h1 className="mt-1 text-[22px] font-semibold tracking-[-0.03em] sm:text-2xl">Olá, Erick</h1>
              </div>
              <button type="button" onClick={logout} className="flex items-center gap-2 rounded-xl border border-[#E6D8C5] bg-white px-3 py-2 text-xs text-[#746C64] lg:hidden">
                <LogOut className="size-4" /> Sair
              </button>
            </div>
          </header>

          <div className="mx-auto max-w-[1400px] px-4 py-5 sm:px-6 sm:py-7 lg:px-10 lg:py-8">
            {tab === "dashboard" && <Dashboard patients={patients.length} exercises={exercises.length} />}
            {tab === "pacientes" && <Patients patients={patients} onAdd={() => setModal("patient")} />}
            {tab === "exercicios" && <Exercises exercises={exercises} onAdd={() => setModal("exercise")} />}
            {tab === "relatorios" && <Placeholder icon={FileText} title="Relatórios" text="Área destinada aos relatórios clínicos e administrativos." />}
            {tab === "configuracoes" && <Placeholder icon={Settings} title="Configurações" text="Área destinada às configurações do sistema." />}
          </div>
        </div>
      </div>

      <nav className="fixed inset-x-3 bottom-3 z-30 flex items-center justify-around rounded-2xl border border-[#dfd0bb] bg-white/95 px-1 py-2 shadow-[0_14px_40px_rgba(64,48,30,0.16)] backdrop-blur-xl lg:hidden">
        {nav.map(({ id, label, icon: Icon }) => (
          <button key={id} type="button" onClick={() => setTab(id)} className={`flex min-w-0 flex-1 flex-col items-center gap-1 rounded-xl px-1 py-1.5 text-[9px] font-medium ${
            tab === id ? "bg-[#BA9051]/10 text-[#A97A3C]" : "text-[#8e857c]"
          }`}>
            <Icon className="size-[18px]" strokeWidth={1.8} /><span className="truncate">{label}</span>
          </button>
        ))}
        <button type="button" onClick={logout} className="flex min-w-0 flex-1 flex-col items-center gap-1 rounded-xl px-1 py-1.5 text-[9px] text-[#8e857c]">
          <LogOut className="size-[18px]" /><span>Sair</span>
        </button>
      </nav>

      {modal === "patient" && (
        <Modal title="Cadastrar paciente" close={() => setModal(null)}>
          <form onSubmit={addPatient} className="space-y-4">
            <Field label="Nome do paciente" value={patient.name} onChange={(v) => setPatient({ ...patient, name: v })} placeholder="Ex.: Miguel Oliveira" required />
            <Field label="Idade" value={patient.age} onChange={(v) => setPatient({ ...patient, age: v })} placeholder="Ex.: 8 meses" />
            <Field label="Responsável" value={patient.responsible} onChange={(v) => setPatient({ ...patient, responsible: v })} placeholder="Ex.: Ana Oliveira" />
            <Actions close={() => setModal(null)} label="Cadastrar paciente" />
          </form>
        </Modal>
      )}

      {modal === "exercise" && (
        <Modal title="Adicionar exercício" close={() => setModal(null)}>
          <form onSubmit={addExercise} className="space-y-4">
            <Field label="Nome do exercício" value={exercise.name} onChange={(v) => setExercise({ ...exercise, name: v })} placeholder="Ex.: Estimulação cervical" required />
            <Field label="Tipo" value={exercise.type} onChange={(v) => setExercise({ ...exercise, type: v })} placeholder="Ex.: Vídeo" />
            <Field label="Descrição" value={exercise.description} onChange={(v) => setExercise({ ...exercise, description: v })} placeholder="Descreva o exercício" />
            <Actions close={() => setModal(null)} label="Adicionar exercício" />
          </form>
        </Modal>
      )}
    </main>
  );
}

function Dashboard({ patients, exercises }: { patients: number; exercises: number }) {
  return <section className="space-y-6">
    <div><p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#A97A3C]">Visão geral</p>
      <h2 className="mt-1 text-xl font-semibold sm:text-2xl">Dashboard</h2>
      <p className="mt-1 text-xs text-[#837970]">Resumo do seu painel administrativo.</p>
    </div>
    <div className="grid gap-4 sm:grid-cols-2">
      <Summary icon={Users} label="Pacientes ativos" value={patients} />
      <Summary icon={Dumbbell} label="Exercícios cadastrados" value={exercises} />
    </div>
  </section>;
}

function Patients({ patients, onAdd }: { patients: Patient[]; onAdd: () => void }) {
  return <section className="space-y-5">
    <Header title="Pacientes" text="Lista de pacientes cadastrados." action="Cadastrar paciente" onAction={onAdd} />
    <div className="overflow-hidden rounded-[1.35rem] border border-[#e6d9c9] bg-white shadow-[0_10px_30px_rgba(64,48,30,0.045)]">
      <div className="hidden grid-cols-[1.4fr_1fr_1fr] gap-4 border-b border-[#eee5d9] bg-[#fdfbf8] px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#9a9087] sm:grid">
        <span>Paciente</span><span>Idade</span><span>Responsável</span>
      </div>
      <div className="divide-y divide-[#f0e8dd]">
        {patients.map((p) => <div key={p.name} className="grid gap-2 px-4 py-4 sm:grid-cols-[1.4fr_1fr_1fr] sm:items-center sm:px-5">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-full bg-[#f3e3cf] text-[11px] font-semibold text-[#8a6335]">{p.name.split(" ").slice(0,2).map(x => x[0]).join("")}</span>
            <p className="text-sm font-semibold">{p.name}</p>
          </div>
          <p className="text-xs text-[#746c64]">{p.age}</p>
          <p className="text-xs text-[#746c64]">{p.responsible}</p>
        </div>)}
      </div>
    </div>
  </section>;
}

function Exercises({ exercises, onAdd }: { exercises: Exercise[]; onAdd: () => void }) {
  return <section className="space-y-5">
    <Header title="Exercícios" text="Lista de exercícios cadastrados." action="Adicionar exercício" onAction={onAdd} />
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {exercises.map((e) => <article key={e.name} className="rounded-[1.35rem] border border-[#e6d9c9] bg-white p-5 shadow-[0_10px_30px_rgba(64,48,30,0.045)]">
        <div className="flex items-start gap-3">
          <span className="flex size-11 items-center justify-center rounded-xl bg-[#f3e3cf] text-[#A97A3C]"><Dumbbell className="size-5" /></span>
          <div><h3 className="text-sm font-semibold">{e.name}</h3><span className="mt-1 inline-flex rounded-full bg-[#BA9051]/10 px-2 py-1 text-[9px] text-[#A97A3C]">{e.type}</span></div>
        </div>
        <p className="mt-4 text-xs leading-relaxed text-[#81776e]">{e.description}</p>
      </article>)}
    </div>
  </section>;
}

function Header({ title, text, action, onAction }: { title: string; text: string; action: string; onAction: () => void }) {
  return <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
    <div><p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#A97A3C]">Gestão</p><h2 className="mt-1 text-xl font-semibold sm:text-2xl">{title}</h2><p className="mt-1 text-xs text-[#837970]">{text}</p></div>
    <Button onClick={onAction} className="h-10 rounded-xl bg-[#BA9051] text-xs font-semibold hover:bg-[#A97A3C]"><Plus className="size-4" />{action}</Button>
  </div>;
}

function Summary({ icon: Icon, label, value }: { icon: typeof Users; label: string; value: number }) {
  return <div className="rounded-[1.35rem] border border-[#e6d9c9] bg-white p-5 shadow-[0_10px_30px_rgba(64,48,30,0.05)] sm:p-6">
    <span className="flex size-10 items-center justify-center rounded-xl bg-[#BA9051]/10 text-[#BA9051]"><Icon className="size-[18px]" /></span>
    <p className="mt-5 text-[10px] font-medium uppercase tracking-[0.12em] text-[#948a81]">{label}</p>
    <p className="mt-1 text-[30px] font-semibold">{value}</p>
  </div>;
}

function Placeholder({ icon: Icon, title, text }: { icon: typeof FileText; title: string; text: string }) {
  return <section className="space-y-5"><div><p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#A97A3C]">Sistema</p><h2 className="mt-1 text-xl font-semibold sm:text-2xl">{title}</h2></div>
    <div className="flex min-h-[280px] flex-col items-center justify-center rounded-[1.35rem] border border-dashed border-[#dccbb5] bg-white p-8 text-center"><Icon className="size-6 text-[#BA9051]" /><h3 className="mt-4 text-sm font-semibold">{title}</h3><p className="mt-1 text-xs text-[#8c8178]">{text}</p></div>
  </section>;
}

function Modal({ title, close, children }: { title: string; close: () => void; children: ReactNode }) {
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#2D2823]/30 p-4 backdrop-blur-sm">
    <div className="w-full max-w-md rounded-[1.5rem] border border-[#e3d3bd] bg-white p-5 shadow-[0_25px_80px_rgba(64,48,30,0.2)] sm:p-6">
      <div className="mb-5 flex items-center justify-between"><h2 className="text-base font-semibold">{title}</h2><button type="button" onClick={close} className="size-8 rounded-lg text-xl text-[#91877e]">×</button></div>
      {children}
    </div>
  </div>;
}

function Field({ label, value, onChange, placeholder, required }: { label: string; value: string; onChange: (v: string) => void; placeholder: string; required?: boolean }) {
  return <label className="block"><span className="mb-1.5 block text-[11px] font-medium text-[#746c64]">{label}</span>
    <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} required={required}
      className="h-11 w-full rounded-xl border border-[#e6d8c5] bg-[#fdfbf8] px-3 text-sm outline-none focus:border-[#BA9051] focus:ring-2 focus:ring-[#BA9051]/10" />
  </label>;
}

function Actions({ close, label }: { close: () => void; label: string }) {
  return <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
    <Button type="button" variant="outline" onClick={close} className="h-10 rounded-xl text-xs">Cancelar</Button>
    <Button type="submit" className="h-10 rounded-xl bg-[#BA9051] text-xs font-semibold hover:bg-[#A97A3C]">{label}</Button>
  </div>;
}

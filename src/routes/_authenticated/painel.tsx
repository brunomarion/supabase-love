import { useState, type FormEvent, type ReactNode } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  Dumbbell,
  FileBarChart3,
  LogOut,
  Menu,
  Plus,
  Settings,
  Users,
  Video,
  X,
  type LucideIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { signOut } from "@/lib/auth";
import logo from "@/assets/logo-erick-paulino.jpg.asset.json";

export const Route = createFileRoute("/_authenticated/painel")({
  head: () => ({
    meta: [
      { title: "Dashboard | Erick Paulino Fisioterapia" },
      {
        name: "description",
        content: "Dashboard do fisioterapeuta na plataforma Erick Paulino.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: PainelPage,
});

const navigation = [
  { label: "Pacientes", icon: Users },
  { label: "Exercícios", icon: Dumbbell },
  { label: "Relatórios", icon: FileBarChart3 },
  { label: "Configurações", icon: Settings },
];

const initialPatients = [
  { name: "Miguel Oliveira", age: "8 meses", responsible: "Ana Oliveira", initials: "MO" },
  { name: "Lívia Santos", age: "5 meses", responsible: "Mariana Santos", initials: "LS" },
  { name: "Theo Almeida", age: "11 meses", responsible: "Carolina Almeida", initials: "TA" },
];

const initialExercises = [
  { name: "Estimulação cervical", type: "Vídeo", patients: "12 pacientes" },
  { name: "Estimulação visual", type: "Vídeo", patients: "8 pacientes" },
  { name: "Controle de tronco", type: "Vídeo", patients: "6 pacientes" },
];

function PainelPage() {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("Pacientes");
  const [showPatientForm, setShowPatientForm] = useState(false);
  const [showExerciseForm, setShowExerciseForm] = useState(false);
  const [patients, setPatients] = useState(initialPatients);
  const [exercises, setExercises] = useState(initialExercises);
  const [patientName, setPatientName] = useState("");
  const [patientAge, setPatientAge] = useState("");
  const [responsibleName, setResponsibleName] = useState("");
  const [exerciseName, setExerciseName] = useState("");

  async function handleSignOut() {
    await signOut();
    navigate({ to: "/", replace: true });
  }

  function selectSection(label: string) {
    setActiveSection(label);
    setMobileMenuOpen(false);
  }

  function handlePatientSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = patientName.trim();
    const age = patientAge.trim();
    const responsible = responsibleName.trim();
    if (!name || !age || !responsible) return;

    const initials = name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("");

    setPatients((current) => [...current, { name, age, responsible, initials: initials || "PA" }]);
    setPatientName("");
    setPatientAge("");
    setResponsibleName("");
    setShowPatientForm(false);
  }

  function handleExerciseSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = exerciseName.trim();
    if (!name) return;

    setExercises((current) => [...current, { name, type: "Vídeo", patients: "0 pacientes" }]);
    setExerciseName("");
    setShowExerciseForm(false);
    setActiveSection("Exercícios");
  }

  return (
    <main className="min-h-screen bg-[#faf8f4] text-[#2D2823]">
      <div className="flex min-h-screen">
        <aside className="hidden w-[250px] shrink-0 flex-col border-r border-[#E6D8C5] bg-white lg:flex">
          <LogoHeader />
          <SidebarNavigation activeSection={activeSection} onSelect={selectSection} />
          <SidebarFooter onSignOut={handleSignOut} />
        </aside>

        <div className="min-w-0 flex-1">
          <header className="sticky top-0 z-30 border-b border-[#eee5d9]/90 bg-[#faf8f4]/95 px-4 py-4 backdrop-blur-xl sm:px-6 lg:px-10 lg:py-5">
            <div className="flex items-center justify-between gap-4">
              <div className="flex min-w-0 items-center gap-3">
                <button
                  type="button"
                  aria-label="Abrir menu"
                  onClick={() => setMobileMenuOpen(true)}
                  className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-[#E6D8C5] bg-white text-[#746C64] shadow-[0_5px_18px_rgba(64,48,30,0.05)] lg:hidden"
                >
                  <Menu className="size-5" strokeWidth={1.8} />
                </button>
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#A97A3C]">
                    Painel clínico
                  </p>
                  <h1 className="mt-1 truncate text-[22px] font-semibold tracking-[-0.03em] text-[#2D2823] sm:text-2xl">
                    Olá, Erick <span className="text-base">👋</span>
                  </h1>
                  <p className="mt-0.5 hidden text-xs text-[#746C64] sm:block">
                    Gerencie pacientes e exercícios de forma simples.
                  </p>
                </div>
              </div>
              <span className="hidden size-10 items-center justify-center rounded-full border border-[#E6D8C5] bg-[linear-gradient(145deg,#f8ead7,#e8cfaa)] text-xs font-semibold text-[#7d5a30] sm:flex">
                E
              </span>
            </div>
          </header>

          <div className="mx-auto max-w-[1500px] px-4 py-5 sm:px-6 sm:py-7 lg:px-10 lg:py-8">
            {activeSection === "Pacientes" && (
              <section>
                <SectionHeader
                  icon={Users}
                  title="Pacientes"
                  subtitle="Pacientes cadastrados e acompanhados na clínica."
                  buttonLabel="Cadastrar paciente"
                  onClick={() => setShowPatientForm(true)}
                />
                <div className="mt-5 rounded-[1.35rem] border border-[#e6d9c9] bg-white p-4 shadow-[0_10px_30px_rgba(64,48,30,0.045)] sm:p-5">
                  <div className="mb-4 flex items-center justify-between gap-3 border-b border-[#eee5d9] pb-4">
                    <div>
                      <h2 className="text-sm font-semibold text-[#403a35]">Lista de pacientes</h2>
                      <p className="mt-0.5 text-[10px] text-[#a09991]">
                        {patients.length} paciente{patients.length !== 1 ? "s" : ""} cadastrado{patients.length !== 1 ? "s" : ""}.
                      </p>
                    </div>
                    <Users className="size-5 text-[#BA9051]" strokeWidth={1.7} />
                  </div>
                  <div className="space-y-2">
                    {patients.map((patient) => (
                      <div
                        key={patient.name + patient.responsible}
                        className="flex items-center gap-3 rounded-2xl border border-transparent p-3 transition hover:border-[#eee5d9] hover:bg-[#faf7f2] sm:p-4"
                      >
                        <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-[linear-gradient(145deg,#f8ead7,#ead5b5)] text-[11px] font-semibold text-[#8a6335]">
                          {patient.initials}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-[#403a35]">{patient.name}</p>
                          <p className="mt-1 truncate text-[11px] text-[#8f867d]">
                            {patient.age} · Responsável: {patient.responsible}
                          </p>
                        </div>
                        <span className="hidden rounded-full bg-[#BA9051]/10 px-3 py-1 text-[10px] font-medium text-[#A97A3C] sm:inline-flex">
                          Ativo
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            )}

            {activeSection === "Exercícios" && (
              <section>
                <SectionHeader
                  icon={Dumbbell}
                  title="Exercícios"
                  subtitle="Exercícios disponíveis para seus pacientes."
                  buttonLabel="Cadastrar exercício"
                  onClick={() => setShowExerciseForm(true)}
                />
                <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {exercises.map((exercise) => (
                    <div
                      key={exercise.name}
                      className="rounded-[1.35rem] border border-[#e6d9c9] bg-white p-4 shadow-[0_10px_30px_rgba(64,48,30,0.045)] transition duration-300 hover:-translate-y-0.5 hover:border-[#d8c3a4] hover:shadow-[0_15px_35px_rgba(64,48,30,0.08)]"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <span className="flex size-11 items-center justify-center rounded-xl bg-[linear-gradient(145deg,#f8ead7,#ead5b5)] text-[#A97A3C]">
                          <Video className="size-5" strokeWidth={1.7} />
                        </span>
                        <span className="rounded-full bg-[#BA9051]/10 px-2.5 py-1 text-[9px] font-medium text-[#A97A3C]">
                          {exercise.type}
                        </span>
                      </div>
                      <h2 className="mt-5 text-sm font-semibold text-[#403a35]">{exercise.name}</h2>
                      <p className="mt-1 text-[11px] text-[#938a81]">{exercise.patients}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {activeSection === "Relatórios" && (
              <EmptySection icon={FileBarChart3} title="Relatórios" subtitle="Área reservada para os relatórios clínicos." />
            )}

            {activeSection === "Configurações" && (
              <EmptySection icon={Settings} title="Configurações" subtitle="Área reservada para as configurações da aplicação." />
            )}
          </div>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Fechar menu"
            onClick={() => setMobileMenuOpen(false)}
            className="absolute inset-0 bg-[#2D2823]/30 backdrop-blur-[2px]"
          />
          <aside className="relative flex h-full w-[min(82vw,300px)] flex-col border-r border-[#E6D8C5] bg-white shadow-[12px_0_45px_rgba(64,48,30,0.16)]">
            <div className="flex h-[88px] items-center justify-between border-b border-[#eee5d9] px-5">
              <img src={logo.url} alt="Erick Paulino Fisioterapeuta" className="h-auto w-[138px] object-contain" />
              <button
                type="button"
                aria-label="Fechar menu"
                onClick={() => setMobileMenuOpen(false)}
                className="flex size-9 items-center justify-center rounded-xl border border-[#E6D8C5] text-[#746C64]"
              >
                <X className="size-4" />
              </button>
            </div>
            <SidebarNavigation activeSection={activeSection} onSelect={selectSection} />
            <div className="mt-auto border-t border-[#eee5d9] p-4">
              <button
                type="button"
                onClick={handleSignOut}
                className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm text-[#8a8178] transition hover:bg-[#faf7f2] hover:text-[#A97A3C]"
              >
                <LogOut className="size-[18px]" strokeWidth={1.8} />
                Sair
              </button>
            </div>
          </aside>
        </div>
      )}

      {showPatientForm && (
        <Modal title="Cadastrar paciente" onClose={() => setShowPatientForm(false)}>
          <form onSubmit={handlePatientSubmit} className="space-y-4">
            <Field label="Nome do paciente" value={patientName} onChange={setPatientName} placeholder="Ex.: João da Silva" required />
            <Field label="Idade" value={patientAge} onChange={setPatientAge} placeholder="Ex.: 7 meses" required />
            <Field label="Nome do responsável" value={responsibleName} onChange={setResponsibleName} placeholder="Ex.: Maria da Silva" required />
            <ModalActions onCancel={() => setShowPatientForm(false)} label="Cadastrar paciente" />
          </form>
        </Modal>
      )}

      {showExerciseForm && (
        <Modal title="Cadastrar exercício" onClose={() => setShowExerciseForm(false)}>
          <form onSubmit={handleExerciseSubmit} className="space-y-4">
            <Field label="Nome do exercício" value={exerciseName} onChange={setExerciseName} placeholder="Ex.: Estimulação motora" required />
            <ModalActions onCancel={() => setShowExerciseForm(false)} label="Cadastrar exercício" />
          </form>
        </Modal>
      )}
    </main>
  );
}

function LogoHeader() {
  return (
    <div className="flex h-[92px] items-center border-b border-[#eee5d9] px-7">
      <img src={logo.url} alt="Erick Paulino Fisioterapeuta" className="h-auto w-[148px] object-contain" />
    </div>
  );
}

function SidebarNavigation({
  activeSection,
  onSelect,
}: {
  activeSection: string;
  onSelect: (label: string) => void;
}) {
  return (
    <nav className="flex-1 space-y-1 px-4 py-6">
      <p className="mb-3 px-4 text-[9px] font-semibold uppercase tracking-[0.18em] text-[#b0a79e]">Funcionalidades</p>
      {navigation.map((item) => {
        const Icon = item.icon;
        const active = item.label === activeSection;
        return (
          <button
            key={item.label}
            type="button"
            onClick={() => onSelect(item.label)}
            className={
              "group flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-[13px] font-medium transition-all duration-200 " +
              (active
                ? "bg-[#BA9051]/10 text-[#A97A3C] shadow-[inset_3px_0_0_#BA9051]"
                : "text-[#746C64] hover:bg-[#faf7f2] hover:text-[#2D2823]")
            }
          >
            <Icon
              className={
                "size-[18px] shrink-0 " + (active ? "text-[#BA9051]" : "text-[#9b9084]")
              }
              strokeWidth={1.8}
            />
            <span>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}

function SidebarFooter({ onSignOut }: { onSignOut: () => void }) {
  return (
    <div className="border-t border-[#eee5d9] p-4">
      <div className="mb-3 rounded-2xl bg-[linear-gradient(145deg,#fffdf9,#f6eee3)] p-4">
        <div className="flex items-center gap-3">
          <span className="flex size-9 items-center justify-center rounded-full bg-[#BA9051]/10 text-xs font-semibold text-[#A97A3C]">E</span>
          <div className="min-w-0">
            <p className="truncate text-xs font-semibold text-[#403a35]">Erick Paulino</p>
            <p className="mt-0.5 text-[10px] text-[#9a9188]">Fisioterapeuta</p>
          </div>
        </div>
      </div>
      <button
        type="button"
        onClick={onSignOut}
        className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm text-[#8a8178] transition hover:bg-[#faf7f2] hover:text-[#A97A3C]"
      >
        <LogOut className="size-[18px]" strokeWidth={1.8} />
        Sair
      </button>
    </div>
  );
}

function SectionHeader({
  icon: Icon,
  title,
  subtitle,
  buttonLabel,
  onClick,
}: {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  buttonLabel: string;
  onClick: () => void;
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="flex items-center gap-2.5">
        <span className="flex size-10 items-center justify-center rounded-xl bg-[#BA9051]/10 text-[#BA9051]">
          <Icon className="size-[18px]" strokeWidth={1.8} />
        </span>
        <div>
          <h2 className="text-xl font-semibold tracking-[-0.025em] text-[#2D2823]">{title}</h2>
          <p className="mt-1 text-xs text-[#746C64]">{subtitle}</p>
        </div>
      </div>
      <Button
        type="button"
        onClick={onClick}
        className="h-11 rounded-xl bg-[#BA9051] px-4 text-xs font-semibold text-white shadow-[0_8px_22px_rgba(132,88,35,0.18)] transition hover:bg-[#A97A3C]"
      >
        <Plus className="size-4" />
        {buttonLabel}
      </Button>
    </div>
  );
}

function EmptySection({
  icon: Icon,
  title,
  subtitle,
}: {
  icon: LucideIcon;
  title: string;
  subtitle: string;
}) {
  return (
    <section className="flex min-h-[420px] items-center justify-center rounded-[1.5rem] border border-[#e6d9c9] bg-white p-6 text-center shadow-[0_10px_30px_rgba(64,48,30,0.045)]">
      <div className="max-w-sm">
        <span className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-[#BA9051]/10 text-[#BA9051]">
          <Icon className="size-7" strokeWidth={1.6} />
        </span>
        <h2 className="mt-5 text-lg font-semibold text-[#2D2823]">{title}</h2>
        <p className="mt-2 text-sm leading-relaxed text-[#746C64]">{subtitle}</p>
      </div>
    </section>
  );
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <button type="button" aria-label="Fechar" onClick={onClose} className="absolute inset-0 bg-[#2D2823]/35 backdrop-blur-sm" />
      <section className="relative z-10 w-full max-w-md rounded-[1.5rem] border border-[#e6d9c9] bg-white p-5 shadow-[0_25px_80px_rgba(64,48,30,0.2)] sm:p-6">
        <div className="mb-5 flex items-center justify-between gap-3">
          <h2 className="text-base font-semibold text-[#2D2823]">{title}</h2>
          <button type="button" aria-label="Fechar" onClick={onClose} className="flex size-9 items-center justify-center rounded-xl text-[#8f867d] transition hover:bg-[#faf7f2] hover:text-[#A97A3C]">
            <X className="size-4" />
          </button>
        </div>
        {children}
      </section>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  required,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-[#554d46]">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        required={required}
        className="h-11 w-full rounded-xl border border-[#E6D8C5] bg-[#fdfbf8] px-3 text-sm text-[#2D2823] outline-none transition placeholder:text-[#b0a79e] focus:border-[#BA9051] focus:ring-2 focus:ring-[#BA9051]/10"
      />
    </label>
  );
}

function ModalActions({ onCancel, label }: { onCancel: () => void; label: string }) {
  return (
    <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
      <Button type="button" variant="outline" onClick={onCancel} className="h-11 rounded-xl border-[#E6D8C5] text-[#746C64]">
        Cancelar
      </Button>
      <Button type="submit" className="h-11 rounded-xl bg-[#BA9051] px-5 text-xs font-semibold text-white hover:bg-[#A97A3C]">
        {label}
      </Button>
    </div>
  );
}

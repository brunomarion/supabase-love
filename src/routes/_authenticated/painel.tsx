import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  Activity,
  Baby,
  Bell,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  Clock3,
  Dumbbell,
  FileText,
  Home,
  LogOut,
  Menu,
  MessageCircle,
  MoreHorizontal,
  PlayCircle,
  Settings,
  ShieldCheck,
  Sparkles,
  Users,
  Video,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
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
  { label: "Dashboard", icon: Home },
  { label: "Pacientes", icon: Users },
  { label: "Agenda", icon: CalendarDays },
  { label: "Exercícios", icon: Dumbbell },
  { label: "Avaliações", icon: ClipboardCheck },
  { label: "Evoluções", icon: Activity },
  { label: "Orientações", icon: MessageCircle },
  { label: "Configurações", icon: Settings },
];

const appointments = [
  {
    patient: "Miguel Oliveira",
    responsible: "Ana Oliveira",
    time: "14:30",
    type: "Fisioterapia domiciliar",
    status: "Confirmado",
  },
  {
    patient: "Lívia Santos",
    responsible: "Mariana Santos",
    time: "16:00",
    type: "Avaliação fisioterapêutica",
    status: "Pendente",
  },
  {
    patient: "Theo Almeida",
    responsible: "Carolina Almeida",
    time: "17:30",
    type: "Acompanhamento",
    status: "Confirmado",
  },
];

const recentPatients = [
  { name: "Miguel Oliveira", age: "8 meses", responsible: "Ana Oliveira", last: "Hoje", initials: "MO" },
  { name: "Lívia Santos", age: "5 meses", responsible: "Mariana Santos", last: "Ontem", initials: "LS" },
  { name: "Theo Almeida", age: "11 meses", responsible: "Carolina Almeida", last: "18/09", initials: "TA" },
];

const activities = [
  { text: "Nova avaliação registrada", patient: "Miguel Oliveira", time: "Há 20 min", icon: ClipboardCheck },
  { text: "Exercício atribuído", patient: "Lívia Santos", time: "Há 1 h", icon: Dumbbell },
  { text: "Evolução adicionada", patient: "Theo Almeida", time: "Há 2 h", icon: Activity },
  { text: "Novo paciente cadastrado", patient: "Lívia Santos", time: "Ontem", icon: Baby },
];

const exercises = [
  { name: "Estimulação cervical", patients: "12 pacientes", type: "Vídeo", icon: Video },
  { name: "Estimulação visual", patients: "8 pacientes", type: "Vídeo", icon: PlayCircle },
  { name: "Controle de tronco", patients: "6 pacientes", type: "Vídeo", icon: Activity },
];

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

  const displayName = profile?.full_name?.split(" ")[0] || "Erick";

  async function handleSignOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await signOut();
    navigate({ to: "/", replace: true });
  }

  return (
    <main className="min-h-screen bg-[#faf8f4] text-[#2D2823]">
      <div className="flex min-h-screen">
        <aside className="hidden w-[250px] shrink-0 flex-col border-r border-[#E6D8C5] bg-white lg:flex">
          <div className="flex h-[92px] items-center border-b border-[#eee5d9] px-7">
            <img
              src={logo.url}
              alt="Erick Paulino Fisioterapeuta"
              className="h-auto w-[148px] object-contain"
            />
          </div>

          <nav className="flex-1 space-y-1 px-4 py-6">
            {navigation.map((item, index) => {
              const Icon = item.icon;
              const active = index === 0;

              return (
                <button
                  key={item.label}
                  type="button"
                  className={`group flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-[13px] font-medium transition-all duration-200 ${
                    active
                      ? "bg-[#BA9051]/10 text-[#A97A3C] shadow-[inset_3px_0_0_#BA9051]"
                      : "text-[#746C64] hover:bg-[#faf7f2] hover:text-[#2D2823]"
                  }`}
                >
                  <Icon className={`size-[18px] shrink-0 ${active ? "text-[#BA9051]" : "text-[#9b9084]"}`} strokeWidth={1.8} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          <div className="border-t border-[#eee5d9] p-4">
            <div className="mb-3 rounded-2xl bg-[linear-gradient(145deg,#fffdf9,#f6eee3)] p-4">
              <div className="flex items-center gap-3">
                <span className="flex size-9 items-center justify-center rounded-full bg-[#BA9051]/10 text-xs font-semibold text-[#A97A3C]">
                  {displayName.slice(0, 1)}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-xs font-semibold text-[#403a35]">{profile?.full_name || "Erick Paulino"}</p>
                  <p className="mt-0.5 text-[10px] text-[#9a9188]">Fisioterapeuta</p>
                </div>
              </div>
            </div>
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

        <div className="min-w-0 flex-1 pb-24 lg:pb-0">
          <header className="sticky top-0 z-20 border-b border-[#eee5d9]/90 bg-[#faf8f4]/95 px-4 py-4 backdrop-blur-xl sm:px-6 lg:px-10 lg:py-5">
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="hidden rounded-full bg-[#BA9051]/10 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.18em] text-[#A97A3C] sm:inline-flex">
                    Painel clínico
                  </span>
                  <span className="text-[11px] text-[#a39a91]">Hoje, 19 de setembro</span>
                </div>
                <h1 className="mt-1.5 truncate text-[22px] font-semibold tracking-[-0.03em] text-[#2D2823] sm:text-2xl">
                  Olá, {displayName} <span className="text-base">👋</span>
                </h1>
                <p className="mt-0.5 hidden text-xs text-[#746C64] sm:block">
                  Aqui está um resumo dos seus atendimentos.
                </p>
              </div>

              <div className="flex shrink-0 items-center gap-2.5">
                <button
                  type="button"
                  aria-label="Notificações"
                  className="relative flex size-10 items-center justify-center rounded-xl border border-[#E6D8C5] bg-white text-[#746C64] shadow-[0_5px_18px_rgba(64,48,30,0.05)] transition hover:border-[#d8c4a7] hover:text-[#A97A3C]"
                >
                  <Bell className="size-[18px]" strokeWidth={1.8} />
                  <span className="absolute right-2.5 top-2 size-1.5 rounded-full bg-[#BA9051]" />
                </button>
                <button
                  type="button"
                  aria-label="Perfil"
                  className="flex size-10 items-center justify-center rounded-full border border-[#E6D8C5] bg-[linear-gradient(145deg,#f8ead7,#e8cfaa)] text-xs font-semibold text-[#7d5a30] shadow-[0_5px_18px_rgba(64,48,30,0.05)]"
                >
                  {displayName.slice(0, 1)}
                </button>
              </div>
            </div>
          </header>

          <div className="mx-auto max-w-[1500px] space-y-5 px-4 py-5 sm:px-6 sm:py-7 lg:px-10 lg:py-8">
            <section className="grid grid-cols-2 gap-3 xl:grid-cols-4 xl:gap-4">
              <SummaryCard icon={Users} label="Pacientes ativos" value="42" detail="+4 este mês" />
              <SummaryCard icon={CalendarDays} label="Atendimentos hoje" value="5" detail="2 concluídos" />
              <SummaryCard icon={Dumbbell} label="Exercícios atribuídos" value="26" detail="8 esta semana" />
              <SummaryCard icon={Clock3} label="Próximo atendimento" value="14:30" detail="Miguel Oliveira" />
            </section>

            <section className="grid gap-5 xl:grid-cols-[1.45fr_0.85fr]">
              <DashboardCard
                title="Próximos atendimentos"
                subtitle="Sua agenda de hoje"
                action="Ver agenda"
                icon={CalendarDays}
              >
                <div className="space-y-1">
                  {appointments.map((appointment) => (
                    <div
                      key={`${appointment.patient}-${appointment.time}`}
                      className="group flex items-center gap-3 rounded-2xl p-3 transition hover:bg-[#faf7f2] sm:gap-4 sm:p-4"
                    >
                      <div className="flex size-11 shrink-0 flex-col items-center justify-center rounded-xl bg-[#BA9051]/10 text-[#A97A3C]">
                        <span className="text-sm font-semibold leading-none">{appointment.time}</span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-semibold text-[#403a35]">{appointment.patient}</p>
                          <Status status={appointment.status} />
                        </div>
                        <p className="mt-1 truncate text-xs text-[#8b8178]">
                          {appointment.responsible} · {appointment.type}
                        </p>
                      </div>
                      <button
                        type="button"
                        aria-label={`Abrir atendimento de ${appointment.patient}`}
                        className="hidden size-8 items-center justify-center rounded-lg text-[#a39a91] transition hover:bg-white hover:text-[#A97A3C] sm:flex"
                      >
                        <ChevronRight className="size-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </DashboardCard>

              <DashboardCard title="Atividade recente" subtitle="Últimas atualizações" icon={Activity}>
                <div className="space-y-5">
                  {activities.map((activity) => {
                    const Icon = activity.icon;
                    return (
                      <div key={`${activity.text}-${activity.patient}`} className="flex gap-3">
                        <span className="relative flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#BA9051]/10 text-[#BA9051]">
                          <Icon className="size-4" strokeWidth={1.8} />
                        </span>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold leading-snug text-[#403a35]">{activity.text}</p>
                          <p className="mt-0.5 text-[11px] text-[#8f867d]">{activity.patient} · {activity.time}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </DashboardCard>
            </section>

            <section className="grid gap-5 xl:grid-cols-[1.05fr_1fr]">
              <DashboardCard title="Pacientes recentes" subtitle="Acompanhamentos mais recentes" icon={Users} action="Ver pacientes">
                <div className="space-y-2">
                  {recentPatients.map((patient) => (
                    <div
                      key={patient.name}
                      className="flex items-center gap-3 rounded-2xl p-2.5 transition hover:bg-[#faf7f2] sm:p-3"
                    >
                      <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[linear-gradient(145deg,#f8ead7,#ead5b5)] text-[11px] font-semibold text-[#8a6335]">
                        {patient.initials}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-[#403a35]">{patient.name}</p>
                        <p className="mt-0.5 truncate text-[11px] text-[#8f867d]">
                          {patient.age} · {patient.responsible}
                        </p>
                      </div>
                      <div className="hidden text-right sm:block">
                        <p className="text-[10px] uppercase tracking-[0.12em] text-[#b0a79e]">Última sessão</p>
                        <p className="mt-1 text-xs font-medium text-[#746C64]">{patient.last}</p>
                      </div>
                      <button
                        type="button"
                        className="flex size-8 items-center justify-center rounded-lg text-[#a39a91] transition hover:bg-white hover:text-[#A97A3C]"
                        aria-label={`Ver ${patient.name}`}
                      >
                        <ChevronRight className="size-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </DashboardCard>

              <DashboardCard title="Exercícios em destaque" subtitle="Mais utilizados recentemente" icon={Dumbbell} action="Ver exercícios">
                <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
                  {exercises.map((exercise) => {
                    const Icon = exercise.icon;
                    return (
                      <div
                        key={exercise.name}
                        className="group flex items-center gap-3 rounded-2xl border border-[#eee5d9] bg-[#fdfbf8] p-3 transition hover:-translate-y-0.5 hover:border-[#d9c4a5] hover:shadow-[0_10px_25px_rgba(64,48,30,0.06)]"
                      >
                        <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[linear-gradient(145deg,#f8ead7,#ead5b5)] text-[#A97A3C]">
                          <Icon className="size-5" strokeWidth={1.7} />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs font-semibold text-[#403a35]">{exercise.name}</p>
                          <p className="mt-1 text-[10px] text-[#938a81]">{exercise.patients}</p>
                        </div>
                        <span className="hidden rounded-full bg-[#BA9051]/8 px-2 py-1 text-[9px] font-medium text-[#A97A3C] sm:inline-flex">
                          {exercise.type}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </DashboardCard>
            </section>

            <section className="overflow-hidden rounded-[1.5rem] border border-[#e3d3bd] bg-[radial-gradient(circle_at_88%_0%,rgba(198,154,89,0.24),transparent_35%),linear-gradient(135deg,#fffdf9_0%,#f7ede0_100%)] p-5 shadow-[0_16px_45px_rgba(64,48,30,0.07)] sm:p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#BA9051]/12 text-[#A97A3C]">
                    <Sparkles className="size-5" strokeWidth={1.7} />
                  </span>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#A97A3C]">Acompanhamento</p>
                    <h2 className="mt-1 text-base font-semibold text-[#2D2823]">Cuidado contínuo para cada pequeno paciente.</h2>
                    <p className="mt-1 max-w-2xl text-xs leading-relaxed text-[#7d746c]">
                      Organize exercícios, avaliações e orientações para manter o tratamento próximo da família.
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  className="h-10 rounded-xl bg-[#BA9051] px-4 text-xs font-semibold text-white shadow-[0_8px_22px_rgba(132,88,35,0.18)] hover:bg-[#A97A3C]"
                >
                  <Baby className="size-4" />
                  Novo paciente
                </Button>
              </div>
            </section>
          </div>
        </div>
      </div>

      <nav className="fixed inset-x-3 bottom-3 z-30 flex items-center justify-around rounded-2xl border border-[#dfd0bb] bg-white/95 px-1.5 py-2 shadow-[0_14px_40px_rgba(64,48,30,0.16)] backdrop-blur-xl lg:hidden">
        {navigation.slice(0, 5).map((item, index) => {
          const Icon = item.icon;
          const active = index === 0;
          return (
            <button
              key={item.label}
              type="button"
              className={`flex min-w-0 flex-1 flex-col items-center gap-1 rounded-xl px-1 py-1.5 text-[9px] font-medium transition ${
                active ? "bg-[#BA9051]/10 text-[#A97A3C]" : "text-[#8e857c]"
              }`}
            >
              <Icon className="size-[18px]" strokeWidth={1.8} />
              <span className="truncate">{item.label}</span>
            </button>
          );
        })}
        <button
          type="button"
          aria-label="Mais opções"
          className="flex min-w-0 flex-1 flex-col items-center gap-1 rounded-xl px-1 py-1.5 text-[9px] font-medium text-[#8e857c]"
        >
          <MoreHorizontal className="size-[18px]" strokeWidth={1.8} />
          <span>Mais</span>
        </button>
      </nav>
    </main>
  );
}

function SummaryCard({
  icon: Icon,
  label,
  value,
  detail,
}: {
  icon: typeof Users;
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="group rounded-2xl border border-[#e6d9c9] bg-white p-4 shadow-[0_10px_30px_rgba(64,48,30,0.05)] transition duration-300 hover:-translate-y-0.5 hover:border-[#d8c3a4] hover:shadow-[0_15px_35px_rgba(64,48,30,0.08)] sm:p-5">
      <div className="flex items-start justify-between gap-2">
        <span className="flex size-9 items-center justify-center rounded-xl bg-[#BA9051]/10 text-[#BA9051] sm:size-10">
          <Icon className="size-[18px]" strokeWidth={1.8} />
        </span>
        <MoreHorizontal className="size-4 text-[#c2b8ae]" />
      </div>
      <p className="mt-4 text-[10px] font-medium uppercase tracking-[0.12em] text-[#948a81] sm:text-[11px]">{label}</p>
      <p className="mt-1 text-[24px] font-semibold tracking-[-0.04em] text-[#2D2823] sm:text-[28px]">{value}</p>
      <p className="mt-1 truncate text-[10px] text-[#a39a91] sm:text-[11px]">{detail}</p>
    </div>
  );
}

function DashboardCard({
  title,
  subtitle,
  icon: Icon,
  action,
  children,
}: {
  title: string;
  subtitle: string;
  icon: typeof Users;
  action?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[1.35rem] border border-[#e6d9c9] bg-white p-4 shadow-[0_10px_30px_rgba(64,48,30,0.045)] sm:p-5">
      <div className="mb-3 flex items-start justify-between gap-3 sm:mb-4">
        <div className="flex items-center gap-2.5">
          <span className="flex size-9 items-center justify-center rounded-xl bg-[#faf4eb] text-[#BA9051]">
            <Icon className="size-4" strokeWidth={1.8} />
          </span>
          <div>
            <h2 className="text-sm font-semibold text-[#403a35]">{title}</h2>
            <p className="mt-0.5 text-[10px] text-[#a09991]">{subtitle}</p>
          </div>
        </div>
        {action ? (
          <button type="button" className="shrink-0 text-[10px] font-semibold text-[#A97A3C] transition hover:text-[#7d5a30]">
            {action}
          </button>
        ) : null}
      </div>
      {children}
    </section>
  );
}

function Status({ status }: { status: string }) {
  const confirmed = status === "Confirmado";
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-medium ${
        confirmed ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
      }`}
    >
      {confirmed ? <CheckCircle2 className="size-2.5" /> : <Clock3 className="size-2.5" />}
      {status}
    </span>
  );
}

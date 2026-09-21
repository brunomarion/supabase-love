import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Dumbbell, FileText, Home, LogOut, MapPin, Pencil, Plus, RefreshCw, Search, Settings, Trash2, UserRound, Users, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { signOut } from "@/lib/auth";
import type { Tables } from "@/integrations/supabase/types";
const logo = "/images/logo-editada-chatgpt.png";

export const Route = createFileRoute("/_authenticated/painel")({
  head: () => ({ meta: [
    { title: "Painel | Erick Paulino Fisioterapia" },
    { name: "description", content: "Painel administrativo do fisioterapeuta Erick Paulino." },
    { name: "robots", content: "noindex" },
  ]}),
  component: PainelPage,
});

type Tab = "dashboard" | "pacientes" | "exercicios" | "relatorios" | "configuracoes";
type Patient = Tables<"patients">;
type Exercise = Tables<"exercises">;

const nav: { id: Tab; label: string; icon: typeof Home }[] = [
  { id: "dashboard", label: "Painel", icon: Home },
  { id: "pacientes", label: "Pacientes", icon: Users },
  { id: "exercicios", label: "Exercícios", icon: Dumbbell },
  { id: "relatorios", label: "Relatórios", icon: FileText },
  { id: "configuracoes", label: "Configurações", icon: Settings },
];

const emptyPatient = {
  full_name: "",
  birth_date: "",
  sex: "" as "" | "male" | "female",
  responsible_name: "",
  responsible_phone: "",
  responsible_email: "",
  cep: "",
  street: "",
  number: "",
  complement: "",
  neighborhood: "",
  city: "",
  state: "",
  password: "",
  notes: "",
  status: "active" as "active" | "inactive",
};

const emptyExercise = {
  name: "",
  description: "",
  type: "Vídeo",
  video_url: "",
  thumbnail_url: "",
  is_active: true,
};

function PainelPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("dashboard");
  const [patientStatusFilter, setPatientStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [patients, setPatients] = useState<Patient[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [patientCount, setPatientCount] = useState(0);
  const [activePatientCount, setActivePatientCount] = useState(0);
  const [exerciseCount, setExerciseCount] = useState(0);
  const [physiotherapistId, setPhysiotherapistId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [confirmPatient, setConfirmPatient] = useState<Patient | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [patientToast, setPatientToast] = useState("");
  const [modal, setModal] = useState<"patient" | "exercise" | null>(null);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [editingExercise, setEditingExercise] = useState<Exercise | null>(null);
  const [patient, setPatient] = useState(emptyPatient);
  const [exercise, setExercise] = useState(emptyExercise);

  useEffect(() => {
    void loadData();
  }, []);

  useEffect(() => {
    if (!patientToast) return;
    const timer = window.setTimeout(() => setPatientToast(""), 4000);
    return () => window.clearTimeout(timer);
  }, [patientToast]);

  useEffect(() => {
    if (!notice && !error) return;
    const timer = window.setTimeout(() => {
      setNotice("");
      setError("");
    }, 4500);
    return () => window.clearTimeout(timer);
  }, [notice, error]);

  async function getPhysiotherapistId() {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) throw new Error("Sessão do fisioterapeuta não encontrada.");

    const { data, error: queryError } = await supabase
      .from("physiotherapists")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (queryError) throw queryError;
    if (!data) throw new Error("Fisioterapeuta autenticado não encontrado.");
    return data.id;
  }

  async function loadData(showRefresh = false) {
    try {
      if (showRefresh) setRefreshing(true);
      else setLoading(true);
      setError("");

      const id = await getPhysiotherapistId();
      setPhysiotherapistId(id);

      const [patientsResult, exercisesResult, patientCountResult, activePatientCountResult, exerciseCountResult] = await Promise.all([
        supabase.from("patients").select("*").eq("physiotherapist_id", id).order("created_at", { ascending: false }),
        supabase.from("exercises").select("*").eq("physiotherapist_id", id).order("created_at", { ascending: false }),
        supabase.from("patients").select("id", { count: "exact", head: true }).eq("physiotherapist_id", id),
        supabase.from("patients").select("id", { count: "exact", head: true }).eq("physiotherapist_id", id).eq("status", "active"),
        supabase.from("exercises").select("id", { count: "exact", head: true }).eq("physiotherapist_id", id).eq("is_active", true),
      ]);

      if (patientsResult.error) throw patientsResult.error;
      if (exercisesResult.error) throw exercisesResult.error;
      if (patientCountResult.error) throw patientCountResult.error;
      if (activePatientCountResult.error) throw activePatientCountResult.error;
      if (exerciseCountResult.error) throw exerciseCountResult.error;

      setPatients(patientsResult.data ?? []);
      setExercises(exercisesResult.data ?? []);
      setPatientCount(patientCountResult.count ?? 0);
      setActivePatientCount(activePatientCountResult.count ?? 0);
      setExerciseCount(exerciseCountResult.count ?? 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível carregar os dados.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  async function logout() {
    await signOut();
    navigate({ to: "/", replace: true });
  }

  function closeModal() {
    const scrollY = window.scrollY;
    const activeElement = document.activeElement;
    if (activeElement instanceof HTMLElement) {
      activeElement.blur();
    }

    // iOS Safari can keep the visual viewport zoomed after the keyboard closes.
    setModal(null);

    window.requestAnimationFrame(() => {
      window.scrollTo(0, scrollY);
      window.requestAnimationFrame(() => {
        window.scrollTo(0, scrollY);
      });
    });
  }

  function openPatientCreate() {
    closeModal();
    setEditingPatient(null);
    setPatient(emptyPatient);
    setModal("patient");
  }

  function openPatientEdit(item: Patient) {
    setEditingPatient(item);
    setPatient({
      ...emptyPatient,
      full_name: item.full_name,
      birth_date: item.birth_date ?? "",
      sex: item.sex ?? "",
      responsible_name: item.responsible_name ?? "",
      responsible_phone: item.responsible_phone ?? "",
      responsible_email: item.responsible_email ?? "",
      cep: item.cep ?? "",
      street: item.street ?? "",
      number: item.number ?? "",
      complement: item.complement ?? "",
      neighborhood: item.neighborhood ?? "",
      city: item.city ?? "",
      state: item.state ?? "",
      notes: item.notes ?? "",
      status: item.status,
    });
    setModal("patient");
  }

  function openExerciseCreate() {
    setEditingExercise(null);
    setExercise(emptyExercise);
    setModal("exercise");
  }

  function openExerciseEdit(item: Exercise) {
    setEditingExercise(item);
    setExercise({
      name: item.name,
      description: item.description ?? "",
      type: item.type,
      video_url: item.video_url ?? "",
      thumbnail_url: item.thumbnail_url ?? "",
      is_active: item.is_active,
    });
    setModal("exercise");
  }

  async function getCreatePatientErrorMessage(functionError: unknown) {
    if (
      functionError &&
      typeof functionError === "object" &&
      "context" in functionError &&
      functionError.context instanceof Response
    ) {
      try {
        const payload = await functionError.context.clone().json() as { error?: string };
        if (payload?.error) return payload.error;
      } catch {
        // Mantém a mensagem padrão caso a resposta não seja JSON.
      }
    }

    return functionError instanceof Error
      ? functionError.message
      : "Não foi possível cadastrar o paciente.";
  }

  async function fillAddressByCep() {
    const cep = patient.cep.replace(/\D/g, "");
    if (cep.length !== 8) return;

    try {
      const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      if (!response.ok) return;
      const data = await response.json() as {
        erro?: boolean;
        logradouro?: string;
        bairro?: string;
        localidade?: string;
        uf?: string;
      };

      if (data.erro) return;

      setPatient((current) => ({
        ...current,
        cep: current.cep.replace(/\D/g, "").replace(/^(\d{5})(\d{3})$/, "$1-$2"),
        street: data.logradouro ?? current.street,
        neighborhood: data.bairro ?? current.neighborhood,
        city: data.localidade ?? current.city,
        state: data.uf ?? current.state,
      }));
    } catch {
      // O endereço continua editável manualmente caso o serviço de CEP esteja indisponível.
    }
  }

  function getPatientAddress(item: Patient) {
    return [
      item.street,
      item.number,
      item.complement,
      item.neighborhood,
      item.city,
      item.state,
      item.cep,
    ].filter(Boolean).join(", ");
  }

  function openPatientMap(item: Patient) {
    const address = getPatientAddress(item);
    if (!address) return;
    window.open(
      `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`,
      "_blank",
      "noopener,noreferrer",
    );
  }

  async function savePatient(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!patient.full_name.trim()) {
      setError("Informe o nome completo do paciente.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      if (editingPatient) {
        const { data, error: functionError } = await supabase.functions.invoke("criar_paciente", {
          body: {
            action: "update_patient",
            patient_id: editingPatient.id,
            full_name: patient.full_name.trim(),
            birth_date: patient.birth_date || null,
            sex: patient.sex || null,
            responsible_name: patient.responsible_name.trim() || null,
            responsible_phone: patient.responsible_phone.trim() || null,
            responsible_email: patient.responsible_email.trim(),
            notes: patient.notes.trim() || null,
            status: patient.status,
            password: patient.password.trim(),
          },
        });

        if (functionError) {
          throw new Error(await getCreatePatientErrorMessage(functionError));
        }

        if (data?.error) {
          throw new Error(data.error);
        }

        const { error: addressUpdateError } = await supabase
          .from("patients")
          .update({
            cep: patient.cep.trim() || null,
            street: patient.street.trim() || null,
            number: patient.number.trim() || null,
            complement: patient.complement.trim() || null,
            neighborhood: patient.neighborhood.trim() || null,
            city: patient.city.trim() || null,
            state: patient.state.trim().toUpperCase() || null,
          })
          .eq("id", editingPatient.id)
          .eq("physiotherapist_id", physiotherapistId);

        if (addressUpdateError) throw addressUpdateError;

        const updatedPatient = data?.patient as Patient | undefined;
        if (!updatedPatient) throw new Error("O paciente não pôde ser atualizado.");

        setPatients((currentPatients) =>
          currentPatients.map((item) =>
            item.id === updatedPatient.id ? updatedPatient : item,
          ),
        );
        setNotice("");
        setPatientToast(`Paciente "${updatedPatient.full_name}" atualizado com sucesso.`);
        await loadData();
      } else {
        if (!physiotherapistId) throw new Error("Fisioterapeuta não identificado.");
        if (!patient.responsible_email.trim()) throw new Error("O e-mail do responsável é necessário para criar o acesso.");
        if (patient.password.length < 6) throw new Error("A senha deve ter pelo menos 6 caracteres.");

        const { error: functionError } = await supabase.functions.invoke("criar_paciente", {
          body: {
            physiotherapist_id: physiotherapistId,
            full_name: patient.full_name.trim(),
            birth_date: patient.birth_date || null,
            sex: patient.sex || null,
            responsible_name: patient.responsible_name.trim() || null,
            responsible_phone: patient.responsible_phone.trim() || null,
            responsible_email: patient.responsible_email.trim(),
            password: patient.password,
            notes: patient.notes.trim() || null,
            status: patient.status,
          },
        });

        if (functionError) {
          throw new Error(await getCreatePatientErrorMessage(functionError));
        }

        const { data: createdPatient } = await supabase
          .from("patients")
          .select("id")
          .eq("physiotherapist_id", physiotherapistId)
          .eq("responsible_email", patient.responsible_email.trim())
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (createdPatient?.id) {
          const { error: addressUpdateError } = await supabase
            .from("patients")
            .update({
              cep: patient.cep.trim() || null,
              street: patient.street.trim() || null,
              number: patient.number.trim() || null,
              complement: patient.complement.trim() || null,
              neighborhood: patient.neighborhood.trim() || null,
              city: patient.city.trim() || null,
              state: patient.state.trim().toUpperCase() || null,
            })
            .eq("id", createdPatient.id)
            .eq("physiotherapist_id", physiotherapistId);

          if (addressUpdateError) throw addressUpdateError;
        }

        setNotice("Paciente cadastrado com sucesso.");
      }

      closeModal();
      setEditingPatient(null);
      setPatient(emptyPatient);
      if (!editingPatient) await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível salvar o paciente.");
    } finally {
      setSaving(false);
    }
  }

  async function removePatient(item: Patient) {
    try {
      setDeleting(item.id);
      setError("");

      const { data, error: functionError } = await supabase.functions.invoke("criar_paciente", {
        body: {
          action: "delete_patient",
          patient_id: item.id,
        },
      });

      if (functionError) {
        throw new Error(await getCreatePatientErrorMessage(functionError));
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      setConfirmPatient(null);
      setNotice("");
      setPatientToast(`Paciente "${item.full_name}" excluído com sucesso.`);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível excluir o paciente.");
    } finally {
      setDeleting(null);
    }
  }

  async function saveExercise(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!exercise.name.trim()) {
      setError("Informe o nome do exercício.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      if (editingExercise) {
        const { error: updateError } = await supabase
          .from("exercises")
          .update({
            name: exercise.name.trim(),
            description: exercise.description.trim() || null,
            type: exercise.type.trim() || "Vídeo",
            video_url: exercise.video_url.trim() || null,
            thumbnail_url: exercise.thumbnail_url.trim() || null,
            is_active: exercise.is_active,
          })
          .eq("id", editingExercise.id);

        if (updateError) throw updateError;
        setNotice("Exercício atualizado com sucesso.");
      } else {
        if (!physiotherapistId) throw new Error("Fisioterapeuta não identificado.");

        const { error: insertError } = await supabase.from("exercises").insert({
          physiotherapist_id: physiotherapistId,
          name: exercise.name.trim(),
          description: exercise.description.trim() || null,
          type: exercise.type.trim() || "Vídeo",
          video_url: exercise.video_url.trim() || null,
          thumbnail_url: exercise.thumbnail_url.trim() || null,
          is_active: exercise.is_active,
        });

        if (insertError) throw insertError;
        setNotice("Exercício adicionado com sucesso.");
      }

      closeModal();
      setEditingExercise(null);
      setExercise(emptyExercise);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível salvar o exercício.");
    } finally {
      setSaving(false);
    }
  }

  async function removeExercise(item: Exercise) {
    if (!window.confirm(`Deseja realmente excluir o exercício "${item.name}"?`)) return;
    try {
      setDeleting(item.id);
      const { error: deleteError } = await supabase.from("exercises").delete().eq("id", item.id);
      if (deleteError) throw deleteError;
      setNotice("Exercício excluído com sucesso.");
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível excluir o exercício.");
    } finally {
      setDeleting(null);
    }
  }

  return (
    <main className="h-screen overflow-hidden bg-[#faf8f4] text-[#2D2823]">
      {patientToast && (
        <div className="fixed inset-x-4 top-4 z-[80] flex justify-center pointer-events-none sm:inset-x-auto sm:right-6 sm:top-6">
          <div className="pointer-events-auto flex w-full max-w-[390px] items-center gap-3 rounded-2xl border border-[#dfc8a5] bg-white/95 px-4 py-3.5 shadow-[0_18px_50px_rgba(64,48,30,0.18)] backdrop-blur-xl animate-in slide-in-from-top-3 duration-300">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#BA9051]/12 text-[#A97A3C]">
              <span className="text-base font-semibold">✓</span>
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#A97A3C]">Paciente</p>
              <p className="mt-0.5 text-xs font-medium leading-relaxed text-[#4f4841]">{patientToast}</p>
            </div>
            <button type="button" onClick={() => setPatientToast("")} className="flex size-7 shrink-0 items-center justify-center rounded-lg text-lg leading-none text-[#91877e] transition hover:bg-[#faf7f2] hover:text-[#A97A3C]" aria-label="Fechar mensagem">×</button>
          </div>
        </div>
      )}
      <div className="flex min-h-screen">
        <aside className="hidden w-[250px] shrink-0 flex-col border-r border-[#E6D8C5] bg-white lg:flex">
          <div className="flex h-[92px] items-center justify-center border-b border-[#eee5d9] px-4">
            <img src={logo} alt="Erick Paulino Fisioterapeuta" className="h-full w-full object-contain" />
          </div>
          <nav className="flex-1 space-y-1 px-4 py-6">
            {nav.map(({ id, label, icon: Icon }) => (
              <button key={id} type="button" onClick={() => setTab(id)} className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-[13px] font-medium transition ${tab === id ? "bg-[#BA9051]/10 text-[#A97A3C] shadow-[inset_3px_0_0_#BA9051]" : "text-[#746C64] hover:bg-[#faf7f2] hover:text-[#2D2823]"}`}>
                <Icon className={tab === id ? "size-[18px] text-[#BA9051]" : "size-[18px] text-[#9b9084]"} strokeWidth={1.8} />{label}
              </button>
            ))}
          </nav>
          <div className="border-t border-[#eee5d9] p-4">
            <div className="mb-3 rounded-2xl bg-[linear-gradient(145deg,#fffdf9,#f6eee3)] p-4">
              <div className="flex items-center gap-3"><span className="flex size-9 items-center justify-center rounded-full bg-[#BA9051]/10 text-xs font-semibold text-[#A97A3C]">E</span><div><p className="text-xs font-semibold text-[#403a35]">Erick Paulino</p><p className="mt-0.5 text-[10px] text-[#9a9188]">Fisioterapeuta</p></div></div>
            </div>
            <button type="button" onClick={logout} className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm text-[#c94b4b] transition hover:bg-[#fff0f0] hover:text-[#b83d3d]"><LogOut className="size-[18px]" /> Sair</button>
          </div>
        </aside>

        <div className="min-w-0 flex-1 overflow-hidden pb-24 lg:pb-0">
          <header className="sticky top-0 z-20 border-b border-[#eee5d9]/90 bg-[#faf8f4]/95 px-4 py-3 backdrop-blur-xl sm:px-6 lg:hidden">
            <div className="flex items-center justify-center lg:hidden">
              <img
                src={logo}
                alt="Erick Paulino Fisioterapeuta"
                className="h-auto w-[min(52vw,210px)] object-contain"
              />
              <button type="button" onClick={logout} className="absolute right-4 top-3 flex items-center gap-2 rounded-xl border border-[#f0caca] bg-[#fff5f5] px-3 py-2 text-xs font-medium text-[#c94b4b] transition hover:border-[#e58a8a] hover:bg-[#fff0f0] hover:text-[#b83d3d]"><LogOut className="size-4" /> Sair</button>
            </div>
            <div className="hidden items-center justify-between lg:flex">
              <div />
            </div>
          </header>

          <div className="mx-auto h-full max-w-[1400px] overflow-hidden px-4 py-6 sm:px-6 sm:py-8 lg:px-10 lg:py-14">
            {(loading || refreshing) && <div className="mb-5 flex items-center gap-2 rounded-xl border border-[#e6d9c9] bg-white px-4 py-3 text-xs text-[#746c64]"><RefreshCw className="size-4 animate-spin text-[#BA9051]" />Atualizando dados...</div>}
            {error && <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700">{error}</div>}
            {notice && <div className="mb-5 rounded-xl border border-[#dfcfb8] bg-[#fffaf2] px-4 py-3 text-xs text-[#8a6335]">{notice}</div>}

            {tab === "dashboard" && <Dashboard patients={activePatientCount} exercises={exerciseCount} />}
            {tab === "pacientes" && <Patients patients={patients} patientCount={patientCount} onAdd={openPatientCreate} onEdit={openPatientEdit} onDelete={(item) => setConfirmPatient(item)} onMap={openPatientMap} deleting={deleting} statusFilter={patientStatusFilter} onStatusFilterChange={setPatientStatusFilter} />}
            {tab === "exercicios" && <Exercises exercises={exercises} onAdd={openExerciseCreate} onEdit={openExerciseEdit} onDelete={removeExercise} deleting={deleting} />}
            {tab === "relatorios" && <Placeholder icon={FileText} title="Relatórios" text="Área destinada aos relatórios clínicos e administrativos." />}
            {tab === "configuracoes" && <Placeholder icon={Settings} title="Configurações" text="Área destinada às configurações do sistema." />}
          </div>
        </div>
      </div>

      <nav className="fixed inset-x-3 bottom-3 z-30 grid grid-cols-5 items-stretch gap-1 rounded-2xl border border-[#dfd0bb] bg-white/95 px-2 py-2 shadow-[0_14px_40px_rgba(64,48,30,0.16)] backdrop-blur-xl lg:hidden">
        {nav.map(({ id, label, icon: Icon }) => (
          <button key={id} type="button" onClick={() => setTab(id)} className={`flex min-w-0 flex-col items-center justify-center gap-1 rounded-xl px-1 py-2 text-[9px] font-medium transition ${tab === id ? "bg-[#BA9051]/10 text-[#A97A3C]" : "text-[#8e857c] hover:bg-[#faf7f2]"}`}>
            <Icon className="size-[18px]" strokeWidth={1.8} /><span className="truncate">{label}</span>
          </button>
        ))}
      </nav>

      {modal === "patient" && <Modal title={editingPatient ? "Editar paciente" : "Cadastro de pacientes"} close={() => !saving && setModal(null)}>
        <form onSubmit={savePatient} className="space-y-5">
          <div className="space-y-4">
            <div className="pb-1 text-center">
              <h3 className="text-base font-semibold text-[#A97A3C]">Informações Pessoais</h3>
              <div className="mx-auto mt-2 h-px w-12 bg-[#BA9051]/40" />
            </div>
            <Field label="Nome Completo do Paciente" value={patient.full_name} onChange={(v) => setPatient({ ...patient, full_name: v })} placeholder="Ex.: Miguel Oliveira" required />
            <Field label="Data de nascimento" type="date" value={patient.birth_date} onChange={(v) => setPatient({ ...patient, birth_date: v })} />
            <div className="block">
              <span className="mb-1.5 block text-[11px] font-medium text-[#746c64]">Sexo</span>
              <div className="grid grid-cols-2 gap-2">
                {[
                  ["male", "Masculino"],
                  ["female", "Feminino"],
                ].map(([value, label]) => (
                  <label
                    key={value}
                    className="flex h-11 cursor-pointer items-center gap-3 rounded-xl border border-[#e6d8c5] bg-[#fdfbf8] px-3 text-sm font-medium text-[#746c64] transition hover:border-[#cdb894] hover:bg-[#fffaf2]"
                  >
                    <input
                      type="radio"
                      name="patient-sex"
                      value={value}
                      checked={patient.sex === value}
                      onChange={() => setPatient({ ...patient, sex: value as "" | "male" | "female" })}
                      className="size-4 accent-[#BA9051]"
                    />
                    <span>{label}</span>
                  </label>
                ))}
              </div>
            </div>
            <Field label="Nome do responsável" value={patient.responsible_name} onChange={(v) => setPatient({ ...patient, responsible_name: v })} placeholder="Ex.: Ana Oliveira" />
            <Field label="Telefone do responsável" value={patient.responsible_phone} onChange={(v) => setPatient({ ...patient, responsible_phone: formatPhone(v) })} placeholder="(83) 99999-9999" inputMode="tel" />

            <Field label="Observações" value={patient.notes} onChange={(v) => setPatient({ ...patient, notes: v })} placeholder="Observações do paciente" multiline />

            <div className="border-t border-[#eee5d9] pt-5">
              <div className="mb-4 text-center">
                <h3 className="text-base font-semibold text-[#A97A3C]">Endereço do Paciente</h3>
                <div className="mx-auto mt-2 h-px w-12 bg-[#BA9051]/40" />
              </div>
              <div className="space-y-6"><div className="grid gap-6 sm:grid-cols-[1fr_1.4fr]">
                <label className="block">
                  <span className="mb-1.5 block text-[11px] font-medium text-[#746c64]">CEP</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={patient.cep}
                    onChange={(e) => setPatient({ ...patient, cep: e.target.value.replace(/\\D/g, "").slice(0, 8) })}
                    onBlur={() => void fillAddressByCep()}
                    placeholder="00000-000"
                    className="h-11 w-full rounded-xl border border-[#e6d8c5] bg-[#fdfbf8] px-3 text-base outline-none focus:border-[#BA9051] focus:ring-2 focus:ring-[#BA9051]/10 sm:text-sm"
                  />
                </label>
                <Field label="Rua" value={patient.street} onChange={(v) => setPatient({ ...patient, street: v })} placeholder="Ex.: Rua das Flores" />
              </div>
              <div className="grid gap-6 sm:grid-cols-[0.7fr_1.3fr]">
                <Field label="Número" value={patient.number} onChange={(v) => setPatient({ ...patient, number: v })} placeholder="123" />
                <Field label="Complemento" value={patient.complement} onChange={(v) => setPatient({ ...patient, complement: v })} placeholder="Apto, casa, bloco..." />
              </div>
              <div className="grid gap-6 sm:grid-cols-2">
                <Field label="Bairro" value={patient.neighborhood} onChange={(v) => setPatient({ ...patient, neighborhood: v })} placeholder="Ex.: Manaíra" />
                <Field label="Cidade" value={patient.city} onChange={(v) => setPatient({ ...patient, city: v })} placeholder="Ex.: João Pessoa" />
              </div>
              <Field label="Estado" value={patient.state} onChange={(v) => setPatient({ ...patient, state: v.slice(0, 2).toUpperCase() })} placeholder="Ex.: PB" />
              </div>
            </div>

          </div>

          <div className="border-t border-[#eee5d9] pt-5">
            <div className="mb-4 text-center">
              <h3 className="text-base font-semibold text-[#A97A3C]">Dados de Acesso</h3>
              <div className="mx-auto mt-2 h-px w-12 bg-[#BA9051]/40" />
            </div>
            <div className="space-y-4">
              <Field label="E-mail do responsável" type="email" value={patient.responsible_email} onChange={(v) => setPatient({ ...patient, responsible_email: v })} placeholder="responsavel@email.com" required={!editingPatient} />
              {editingPatient && <Field label="Nova senha" type="password" value={patient.password} onChange={(v) => setPatient({ ...patient, password: v })} placeholder="Deixe em branco para manter a senha atual" />}
              {!editingPatient && <Field label="Senha" type="password" value={patient.password} onChange={(v) => setPatient({ ...patient, password: v })} placeholder="Mínimo de 6 caracteres" required />}
              <div className="block">
              <span className="mb-1.5 block text-[11px] font-medium text-[#746c64]">Status</span>
              <label className={`flex cursor-pointer items-center justify-between rounded-xl border px-4 py-3 transition ${
                patient.status === "active"
                  ? "border-[#dfc28f] bg-[#f3e3cf] hover:border-[#cdb894] hover:bg-[#eedbc0]"
                  : "border-[#efcaca] bg-[#fff0f0] hover:border-[#e58a8a] hover:bg-[#ffe8e8]"
              }`}>
                <div>
                  <p className="text-sm font-medium text-[#4f4841]">{patient.status === "active" ? "Paciente ativo" : "Paciente inativo"}</p>
                  <p className="mt-0.5 text-[10px] text-[#91877e]">{patient.status === "active" ? "O paciente está ativo no sistema." : "O paciente está marcado como inativo."}</p>
                </div>
                <span className="relative ml-4 inline-flex shrink-0 items-center">
                  <input
                    type="checkbox"
                    checked={patient.status === "active"}
                    onChange={(e) => setPatient({ ...patient, status: e.target.checked ? "active" : "inactive" })}
                    className="peer sr-only"
                  />
                  <span className="h-7 w-12 rounded-full bg-[#d8d0c7] shadow-inner transition-colors peer-checked:bg-[#BA9051] peer-focus-visible:ring-2 peer-focus-visible:ring-[#BA9051]/30 peer-focus-visible:ring-offset-2" />
                  <span className="pointer-events-none absolute left-1 size-5 rounded-full bg-white shadow-[0_2px_6px_rgba(64,48,30,0.22)] transition-transform peer-checked:translate-x-5" />
                </span>
              </label>
            </div>
            </div>
          </div>

          <Actions close={() => setModal(null)} label={editingPatient ? "Salvar alterações" : "Cadastrar Paciente"} loading={saving} />
        </form>
      </Modal>}

      {confirmPatient && <DeletePatientModal patient={confirmPatient} loading={deleting === confirmPatient.id} close={() => !deleting && setConfirmPatient(null)} confirm={() => void removePatient(confirmPatient)} />}

      {modal === "exercise" && <Modal title={editingExercise ? "Editar exercício" : "Adicionar exercício"} close={() => !saving && setModal(null)}>
        <form onSubmit={saveExercise} className="space-y-4">
          <Field label="Nome do exercício" value={exercise.name} onChange={(v) => setExercise({ ...exercise, name: v })} placeholder="Ex.: Estimulação cervical" required />
          <Field label="Descrição" value={exercise.description} onChange={(v) => setExercise({ ...exercise, description: v })} placeholder="Descreva o exercício" multiline />
          <Field label="Tipo" value={exercise.type} onChange={(v) => setExercise({ ...exercise, type: v })} placeholder="Ex.: Vídeo" />
          <Field label="URL do vídeo" type="url" value={exercise.video_url} onChange={(v) => setExercise({ ...exercise, video_url: v })} placeholder="https://..." />
          <Field label="URL da miniatura" type="url" value={exercise.thumbnail_url} onChange={(v) => setExercise({ ...exercise, thumbnail_url: v })} placeholder="https://..." />
          <SelectField label="Status" value={exercise.is_active ? "active" : "inactive"} onChange={(v) => setExercise({ ...exercise, is_active: v === "active" })} options={[[ "active", "Ativo"], ["inactive", "Inativo"]]} />
          <Actions close={() => setModal(null)} label={editingExercise ? "Salvar alterações" : "Adicionar exercício"} loading={saving} />
        </form>
      </Modal>}
    </main>
  );
}

function Dashboard({ patients, exercises }: { patients: number; exercises: number }) {
  return <section className="space-y-6">
    <div className="lg:hidden">
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#A97A3C]">Painel Administrativo</p>
      <h2 className="mt-1 text-xl font-semibold tracking-[-0.03em] text-[#2D2823]">Olá, Erick! <span aria-hidden="true">👋</span></h2>
    </div>
    <div className="hidden lg:block">
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#A97A3C]">Painel Administrativo</p>
      <h2 className="mt-1 text-xl font-semibold sm:text-2xl">Olá, Erick! <span aria-hidden="true">👋</span></h2>
    </div>
    <div className="grid gap-4 sm:grid-cols-2"><Summary icon={Users} label="Pacientes ativos" value={patients} /><Summary icon={Dumbbell} label="Exercícios cadastrados" value={exercises} /></div>
  </section>;
}

function Patients({ patients, patientCount, onAdd, onEdit, onDelete, onMap, deleting, statusFilter, onStatusFilterChange }: { patients: Patient[]; patientCount: number; onAdd: () => void; onEdit: (patient: Patient) => void; onDelete: (patient: Patient) => void; onMap: (patient: Patient) => void; deleting: string | null; statusFilter: "all" | "active" | "inactive"; onStatusFilterChange: (value: "all" | "active" | "inactive") => void }) {
  const [patientSearch, setPatientSearch] = useState("");

  function getPatientAddress(item: Patient) {
    return [item.street, item.number, item.complement, item.neighborhood, item.city, item.state, item.cep].filter(Boolean).join(", ");
  }

  const filteredPatients = patients.filter((patient) => {
    const matchesStatus = statusFilter === "all" || patient.status === statusFilter;
    const search = patientSearch.trim().toLocaleLowerCase("pt-BR");
    if (!search) return matchesStatus;
    return matchesStatus && [patient.full_name, patient.responsible_name, patient.responsible_email, patient.responsible_phone]
      .filter(Boolean)
      .some((value) => value!.toLocaleLowerCase("pt-BR").includes(search));
  });

  const [page, setPage] = useState(1);
  const pageSize = 5;

  useEffect(() => {
    setPage(1);
  }, [statusFilter, patientSearch]);

  const totalPages = Math.max(1, Math.ceil(filteredPatients.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedPatients = filteredPatients.slice(startIndex, startIndex + pageSize);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const Filter = ({ mobile = false }: { mobile?: boolean }) => (
    <div className={`flex items-center gap-2 rounded-2xl border border-[#e6d8c5] bg-white/95 px-3 py-2.5 shadow-[0_6px_20px_rgba(64,48,30,0.07)] ${mobile ? "shrink-0 w-fit" : ""}`}>
      <span className="text-[9px] font-semibold uppercase tracking-[0.12em] text-[#9a9087]">Filtrar por status:</span>
      <label className="group flex cursor-pointer items-center gap-1.5 rounded-lg px-1.5 py-1 text-[11px] font-semibold text-[#5f574f] transition hover:bg-[#faf7f2]">
        <span className="relative flex size-[17px] items-center justify-center">
          <input type="checkbox" checked={statusFilter === "active"} onChange={(e) => onStatusFilterChange(e.target.checked ? "active" : "all")} className="peer sr-only" />
          <span className="absolute inset-0 rounded-[5px] border border-[#d7c7b1] bg-[#fffdf9] shadow-[inset_0_1px_2px_rgba(64,48,30,0.06)] transition-all peer-checked:border-[#BA9051] peer-checked:bg-[#BA9051] peer-focus-visible:ring-2 peer-focus-visible:ring-[#BA9051]/20" />
          <span className="pointer-events-none absolute hidden size-2.5 rotate-45 border-b-2 border-r-2 border-white peer-checked:block" />
        </span>
        Ativo
      </label>
      <label className="group flex cursor-pointer items-center gap-1.5 rounded-lg px-1.5 py-1 text-[11px] font-semibold text-[#5f574f] transition hover:bg-[#fff8f8]">
        <span className="relative flex size-[17px] items-center justify-center">
          <input type="checkbox" checked={statusFilter === "inactive"} onChange={(e) => onStatusFilterChange(e.target.checked ? "inactive" : "all")} className="peer sr-only" />
          <span className="absolute inset-0 rounded-[5px] border border-[#e2baba] bg-[#fffafa] shadow-[inset_0_1px_2px_rgba(64,48,30,0.06)] transition-all peer-checked:border-[#d66a6a] peer-checked:bg-[#d66a6a] peer-focus-visible:ring-2 peer-focus-visible:ring-[#d66a6a]/20" />
          <span className="pointer-events-none absolute hidden size-2.5 rotate-45 border-b-2 border-r-2 border-white peer-checked:block" />
        </span>
        Inativo
      </label>
    </div>
  );

  return <section className="space-y-5">
    <div className="space-y-3">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex min-w-0 items-center justify-between gap-4 lg:block">
          <div className="min-w-0">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#A97A3C]">Gestão</p>
                <h2 className="mt-1 text-xl font-semibold sm:text-2xl">Pacientes</h2>
                <p className="mt-1 text-xs text-[#837970]">Lista de pacientes cadastrados.</p>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1.5 lg:hidden">
                <Button onClick={onAdd} className="h-[44px] w-[calc(100%+0px)] rounded-xl bg-[#BA9051] px-3 text-[12px] font-semibold text-white shadow-[0_6px_18px_rgba(186,144,81,0.18)] hover:bg-[#A97A3C]"><Plus className="size-3.5" />Cadastrar Paciente</Button>
                <div className="flex h-[44px] w-full items-center gap-2 rounded-xl border border-[#dfc28f] bg-white/95 px-3 py-2 shadow-[0_6px_20px_rgba(186,144,81,0.12)]">
                  <span className="text-[18px] font-semibold tracking-[-0.03em] text-[#BA9051]">{patientCount}</span>
                  <span className="text-[9px] font-semibold uppercase tracking-[0.08em] text-[#948a81]">pacientes cadastrados</span>
                </div>
              </div>
            </div>
            <div className="mt-4 lg:hidden"><Filter mobile /></div>
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 lg:gap-4">
          <div className="hidden items-center gap-2 rounded-xl border border-[#dfc28f] bg-white/95 px-3 py-2 shadow-[0_6px_20px_rgba(186,144,81,0.12)] lg:flex">
            <span className="text-[18px] font-semibold tracking-[-0.03em] text-[#BA9051]">{patientCount}</span>
            <span className="text-[9px] font-semibold uppercase tracking-[0.08em] text-[#948a81]">pacientes cadastrados</span>
          </div>
          <div className="hidden items-center gap-4 lg:flex">
            <Filter />
            <Button onClick={onAdd} className="h-10 rounded-xl bg-[#BA9051] px-4 text-xs font-semibold shadow-[0_6px_18px_rgba(186,144,81,0.18)] hover:bg-[#A97A3C]"><Plus className="size-4" />Cadastrar Paciente</Button>
          </div>
        </div>
      </div>
      <div className="-mt-3 rounded-2xl border border-[#e6d9c9] bg-white p-2 shadow-[0_6px_20px_rgba(64,48,30,0.045)] lg:mt-0">
        <label className="flex h-11 items-center gap-2.5 rounded-xl border border-[#e6d9c9] bg-[#fdfbf8] px-3 text-[#837970] focus-within:border-[#BA9051] focus-within:ring-2 focus-within:ring-[#BA9051]/10">
          <Search className="size-[17px] shrink-0 text-[#BA9051]" strokeWidth={1.8} />
          <input type="search" value={patientSearch} onChange={(e) => setPatientSearch(e.target.value)} placeholder="Pesquisar paciente, responsável, e-mail ou telefone..." aria-label="Pesquisar pacientes" className="min-w-0 flex-1 bg-transparent text-base text-[#403a35] outline-none placeholder:text-[#a79d94] sm:text-sm" />
          {patientSearch && <button type="button" onClick={() => setPatientSearch("")} aria-label="Limpar pesquisa" className="flex size-7 shrink-0 items-center justify-center rounded-lg text-[#91877e] transition hover:bg-[#f2ece4] hover:text-[#A97A3C]"><X className="size-4" /></button>}
        </label>
      </div>
      
    </div>
    <div className="overflow-hidden rounded-[1.35rem] border border-[#e6d9c9] bg-white shadow-[0_10px_30px_rgba(64,48,30,0.045)]">
      <div className="hidden grid-cols-[1.35fr_1fr_1.25fr_0.8fr_110px] gap-4 border-b border-[#eee5d9] bg-[#fdfbf8] px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#9a9087] sm:grid"><span>Paciente</span><span>Responsável</span><span>E-mail do responsável</span><span>Status</span><span>Ações</span></div>
      <div className="h-[calc(100vh-420px)] min-h-[180px] max-h-[calc(100vh-360px)] overflow-y-auto overscroll-contain divide-y divide-[#d9c8b4] sm:h-auto sm:min-h-[220px] sm:max-h-[calc(100vh-250px)]">
        {filteredPatients.length === 0 ? <Empty text={statusFilter === "all" ? "Nenhum paciente cadastrado ainda." : statusFilter === "active" ? "Nenhum paciente ativo encontrado." : "Nenhum paciente inativo encontrado."} /> : <>
          <div className="sm:hidden divide-y divide-[#d9c8b4]">{filteredPatients.map((p) => (
            <div key={p.id} className={`grid grid-cols-[minmax(0,1fr)_auto] grid-rows-[auto_auto] gap-x-3 gap-y-0 px-3 py-3 ${p.sex === "female" ? "bg-[#fff1f6] hover:bg-[#ffebf2]" : p.sex === "male" ? "bg-[#eff7ff] hover:bg-[#e7f2ff]" : "bg-white hover:bg-[#fdfbf8]"} transition-colors`}>
              <div className="flex min-w-0 items-center gap-2.5"><span className={`flex size-9 shrink-0 items-center justify-center rounded-full ${p.sex === "female" ? "bg-[#ffe4ef] text-[#d95c91]" : p.sex === "male" ? "bg-[#e2f0ff] text-[#3d82c8]" : "bg-[#f3e3cf] text-[#8a6335]"}`}>{p.sex === "male" || p.sex === "female" ? <UserRound className="size-[18px]" strokeWidth={2} /> : initials(p.full_name)}</span><div className="min-w-0"><p className="truncate text-[14px] font-semibold">{p.full_name}</p></div></div>
              <div className="flex flex-col items-end justify-start text-[10px] text-[#948a81] whitespace-nowrap leading-none"><span>Data de Cadastro:</span><span>{formatDate(p.created_at)}</span></div>
              <div className="flex items-center"><Status active={p.status === "active"} /></div>
              <div className="flex flex-col items-end justify-center gap-0.5"><span className="text-[10px] font-bold leading-none text-[#746c64]">Ações:</span><div className="flex items-center justify-end gap-1.5">{getPatientAddress(p) && <IconButton label="Abrir endereço no Google Maps" onClick={() => onMap(p)}><MapPin className="size-4" /></IconButton>}<IconButton label="Editar" onClick={() => onEdit(p)}><Pencil className="size-4" /></IconButton><IconButton label="Excluir" onClick={() => onDelete(p)} disabled={deleting === p.id}>{deleting === p.id ? <RefreshCw className="size-4 animate-spin" /> : <Trash2 className="size-4" />}</IconButton></div></div>
            </div>
          ))}</div>
          <div className="hidden sm:block">{paginatedPatients.map((p) => (
            <div key={p.id} className={`grid grid-cols-[minmax(0,1fr)_auto] gap-2.5 border-b border-[#d9c8b4] px-3 py-3 sm:grid-cols-[1.35fr_1fr_1.25fr_0.8fr_110px] sm:items-center sm:gap-4 sm:px-5 sm:py-4 ${p.sex === "female" ? "bg-[#fff1f6] hover:bg-[#ffebf2]" : p.sex === "male" ? "bg-[#eff7ff] hover:bg-[#e7f2ff]" : "bg-white hover:bg-[#fdfbf8]"} transition-colors`}>
              <div className="flex min-w-0 items-center gap-2.5"><span className={`flex size-9 shrink-0 items-center justify-center rounded-full ${p.sex === "female" ? "bg-[#ffe4ef] text-[#d95c91]" : p.sex === "male" ? "bg-[#e2f0ff] text-[#3d82c8]" : "bg-[#f3e3cf] text-[#8a6335]"}`}>{p.sex === "male" || p.sex === "female" ? <UserRound className="size-[18px]" strokeWidth={2} /> : initials(p.full_name)}</span><div className="min-w-0"><p className="truncate text-[14px] font-semibold sm:text-sm">{p.full_name}</p><p className="text-[10px] text-[#948a81] sm:text-[11px]">Data de Cadastro: {formatDate(p.created_at)}</p></div></div>
              <div className="text-[13px] font-medium text-[#5f574f] sm:text-sm"><span className="sm:hidden font-semibold text-[#746c64]">Responsável: </span>{p.responsible_name || "Não informado"}{p.responsible_phone && <span className="block text-[12px] font-normal text-[#8b8178] sm:text-[13px]">{p.responsible_phone}</span>}</div>
              <div className="hidden min-w-0 text-sm text-[#5f574f] sm:block"><p className="truncate" title={p.responsible_email || "Não informado"}>{p.responsible_email || "Não informado"}</p></div>
              <div className="col-span-1 sm:col-span-1"><Status active={p.status === "active"} /></div>
              <div className="row-span-2 flex items-center justify-end gap-1.5 sm:row-span-1 sm:gap-2">{getPatientAddress(p) && <IconButton label="Abrir endereço no Google Maps" onClick={() => onMap(p)}><MapPin className="size-4" /></IconButton>}<IconButton label="Editar" onClick={() => onEdit(p)}><Pencil className="size-4" /></IconButton><IconButton label="Excluir" onClick={() => onDelete(p)} disabled={deleting === p.id}>{deleting === p.id ? <RefreshCw className="size-4 animate-spin" /> : <Trash2 className="size-4" />}</IconButton></div>
            </div>
          ))}</div>
        </>}      </div>
      {filteredPatients.length > 0 && (
        <div className="hidden items-center justify-between gap-3 border-t border-[#eee5d9] bg-[#fdfbf8] px-3 py-3 sm:flex sm:px-5">
          <span className="text-[10px] text-[#948a81]">
            {startIndex + 1}–{Math.min(startIndex + pageSize, filteredPatients.length)} de {filteredPatients.length}
          </span>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              disabled={currentPage === 1}
              aria-label="Página anterior"
              className="flex size-8 items-center justify-center rounded-lg border border-[#dfd2c1] bg-white text-[#746c64] transition hover:border-[#BA9051] hover:text-[#A97A3C] disabled:cursor-not-allowed disabled:opacity-35"
            >
              ‹
            </button>
            <span className="flex min-w-8 items-center justify-center rounded-lg bg-[#BA9051]/10 px-2 py-1.5 text-[10px] font-semibold text-[#A97A3C]">
              {currentPage} / {totalPages}
            </span>
            <button
              type="button"
              onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
              disabled={currentPage === totalPages}
              aria-label="Próxima página"
              className="flex size-8 items-center justify-center rounded-lg border border-[#dfd2c1] bg-white text-[#746c64] transition hover:border-[#BA9051] hover:text-[#A97A3C] disabled:cursor-not-allowed disabled:opacity-35"
            >
              ›
            </button>
          </div>
        </div>
      )}
    </div>
  </section>;
}
function Exercises({ exercises, onAdd, onEdit, onDelete, deleting }: { exercises: Exercise[]; onAdd: () => void; onEdit: (exercise: Exercise) => void; onDelete: (exercise: Exercise) => void; deleting: string | null }) {
  return <section className="space-y-5"><Header title="Exercícios" text="Lista de exercícios cadastrados." action="Adicionar exercício" onAction={onAdd} /><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{exercises.length === 0 ? <div className="md:col-span-2 xl:col-span-3"><Empty text="Nenhum exercício cadastrado ainda." /></div> : exercises.map((e) => <article key={e.id} className="rounded-[1.35rem] border border-[#e6d9c9] bg-white p-5 shadow-[0_10px_30px_rgba(64,48,30,0.045)]"><div className="flex items-start gap-3"><span className="flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[#f3e3cf] text-[#A97A3C]">{e.thumbnail_url ? <img src={e.thumbnail_url} alt="" className="size-full object-cover" /> : <Dumbbell className="size-5" />}</span><div className="min-w-0"><h3 className="truncate text-sm font-semibold">{e.name}</h3><span className="mt-1 inline-flex rounded-full bg-[#BA9051]/10 px-2 py-1 text-[9px] text-[#A97A3C]">{e.type}</span></div></div><p className="mt-4 min-h-10 text-xs leading-relaxed text-[#81776e]">{e.description || "Sem descrição."}</p><div className="mt-4 flex items-center justify-between"><Status active={e.is_active} /><div className="flex gap-2"><IconButton label="Editar" onClick={() => onEdit(e)}><Pencil className="size-4" /></IconButton><IconButton label="Excluir" onClick={() => onDelete(e)} disabled={deleting === e.id}>{deleting === e.id ? <RefreshCw className="size-4 animate-spin" /> : <Trash2 className="size-4" />}</IconButton></div></div></article>)}</div></section>;
}

function Header({ title, text, action, onAction }: { title: string; text: string; action: string; onAction: () => void }) {
  return <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#A97A3C]">Gestão</p><h2 className="mt-1 text-xl font-semibold sm:text-2xl">{title}</h2><p className="mt-1 text-xs text-[#837970]">{text}</p></div><Button onClick={onAction} className="h-10 rounded-xl bg-[#BA9051] text-xs font-semibold hover:bg-[#A97A3C]"><Plus className="size-4" />{action}</Button></div>;
}

function Summary({ icon: Icon, label, value }: { icon: typeof Users; label: string; value: number }) {
  return <div className="group relative overflow-hidden rounded-2xl border border-[#e5d8c7] bg-white p-4 shadow-[0_10px_26px_rgba(64,48,30,0.05)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_16px_34px_rgba(64,48,30,0.08)] sm:rounded-[1.25rem] sm:p-5">
    <div className="absolute inset-x-0 top-0 h-1 bg-[linear-gradient(90deg,#BA9051,#D4B27D,#A97A3C)] opacity-80" />
    <div className="flex items-start justify-between gap-3">
      <span className="flex size-9 items-center justify-center rounded-xl border border-[#eadcc9] bg-[linear-gradient(145deg,#fffaf2,#f7eee2)] text-[#BA9051] shadow-[0_4px_12px_rgba(186,144,81,0.10)] sm:size-10 sm:rounded-2xl">
        <Icon className="size-[17px] sm:size-[18px]" strokeWidth={1.8} />
      </span>
      <span className="mt-1 text-[8px] font-semibold uppercase tracking-[0.1em] text-[#b0a59b]">Total</span>
    </div>
    <p className="mt-3 text-[9px] font-semibold uppercase tracking-[0.1em] text-[#948a81] sm:mt-4">{label}</p>
    <p className="mt-0.5 text-[30px] font-semibold tracking-[-0.04em] text-[#302b26] sm:text-[32px]">{value}</p>
  </div>;
}

function Placeholder({ icon: Icon, title, text }: { icon: typeof FileText; title: string; text: string }) {
  return <section className="space-y-5"><div><p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#A97A3C]">Sistema</p><h2 className="mt-1 text-xl font-semibold sm:text-2xl">{title}</h2></div><div className="flex min-h-[280px] flex-col items-center justify-center rounded-[1.35rem] border border-dashed border-[#dccbb5] bg-white p-8 text-center"><Icon className="size-6 text-[#BA9051]" /><h3 className="mt-4 text-sm font-semibold">{title}</h3><p className="mt-1 text-xs text-[#8c8178]">{text}</p></div></section>;
}

function Modal({ title, close, children }: { title: string; close: () => void; children: ReactNode }) {
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#2D2823]/30 p-4 backdrop-blur-sm" onClick={(e) => e.target === e.currentTarget && close()}><div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-[1.5rem] border border-[#e3d3bd] bg-white p-5 shadow-[0_25px_80px_rgba(64,48,30,0.2)] sm:p-6 lg:max-w-2xl lg:p-7 xl:max-w-3xl"><div className="mb-5 flex items-center justify-between"><h2 className="text-lg font-semibold">{title}</h2><button type="button" onClick={close} className="flex size-11 items-center justify-center rounded-xl border border-[#e2cfb4] bg-[#fffdf9] text-2xl leading-none text-[#746c64] shadow-[0_4px_14px_rgba(64,48,30,0.08)] transition-all duration-200 hover:-translate-y-0.5 hover:border-[#BA9051] hover:bg-[#f8f0e5] hover:text-[#A97A3C] hover:shadow-[0_6px_18px_rgba(186,144,81,0.16)]">×</button></div>{children}</div></div>;
}

function DeletePatientModal({ patient, loading, close, confirm }: { patient: Patient; loading: boolean; close: () => void; confirm: () => void }) {
  return <div className="fixed inset-0 z-[60] flex items-center justify-center bg-[#2D2823]/35 p-4 backdrop-blur-sm" onClick={(e) => e.target === e.currentTarget && close()}>
    <div className="w-full max-w-[410px] overflow-hidden rounded-[1.5rem] border border-[#e3d3bd] bg-white shadow-[0_25px_80px_rgba(64,48,30,0.24)]">
      <div className="h-1.5 bg-[linear-gradient(90deg,#BA9051,#C69A59,#A97A3C)]" />
      <div className="p-6 sm:p-7">
        <div className="flex items-start gap-4">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-[#fff1f1] text-[#d34f4f]">
            <Trash2 className="size-5" />
          </span>
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-[#2D2823]">Excluir paciente?</h2>
            <p className="mt-1.5 text-xs leading-relaxed text-[#746C64]">Você está prestes a excluir o paciente:</p>
            <p className="mt-1 text-sm font-semibold text-[#A97A3C]">{patient.full_name}</p>
            <p className="mt-3 text-xs leading-relaxed text-[#8a8178]">Essa ação não pode ser desfeita e o paciente será removido da lista.</p>
          </div>
        </div>
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" onClick={close} disabled={loading} className="h-10 rounded-xl border-[#e6d8c5] text-xs text-[#746C64]">Cancelar</Button>
          <Button type="button" onClick={confirm} disabled={loading} className="h-10 rounded-xl bg-[#c94b4b] text-xs font-semibold text-white hover:bg-[#b83d3d]">
            {loading ? <RefreshCw className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
            {loading ? "Excluindo..." : "Sim, excluir paciente"}
          </Button>
        </div>
      </div>
    </div>
  </div>;
}

function Field({ label, value, onChange, placeholder, required, type = "text", multiline = false }: { label: string; value: string; onChange: (value: string) => void; placeholder: string; required?: boolean; type?: string; multiline?: boolean }) {
  const className="w-full rounded-xl border border-[#e6d8c5] bg-[#fdfbf8] px-3 text-base sm:text-sm outline-none focus:border-[#BA9051] focus:ring-2 focus:ring-[#BA9051]/10";
  return <label className="block"><span className="mb-1.5 block text-[11px] font-medium text-[#746c64]">{label}</span>{multiline ? <textarea value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} required={required} rows={3} className={`${className} min-h-24 py-3 resize-none`} /> : <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} required={required} className={`${className} h-11`} />}</label>;
}

function SelectField({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: [string, string][] }) {
  return <label className="block"><span className="mb-1.5 block text-[11px] font-medium text-[#746c64]">{label}</span><select value={value} onChange={(e) => onChange(e.target.value)} className="h-11 w-full rounded-xl border border-[#e6d8c5] bg-[#fdfbf8] px-3 text-base sm:text-sm outline-none focus:border-[#BA9051] focus:ring-2 focus:ring-[#BA9051]/10">{options.map(([optionValue, optionLabel]) => <option key={optionValue} value={optionValue}>{optionLabel}</option>)}</select></label>;
}

function Actions({ close, label, loading }: { close: () => void; label: string; loading: boolean }) {
  return <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end"><Button type="button" variant="outline" onClick={close} disabled={loading} className="h-10 rounded-xl text-xs">Cancelar</Button><Button type="submit" disabled={loading} className="h-10 rounded-xl bg-[#BA9051] text-xs font-semibold hover:bg-[#A97A3C]">{loading ? <RefreshCw className="size-4 animate-spin" /> : null}{loading ? "Salvando..." : label}</Button></div>;
}

function IconButton({ label, onClick, disabled, children }: { label: string; onClick: () => void; disabled?: boolean; children: ReactNode }) {
  const location = label === "Abrir endereço no Google Maps";
  const destructive = label === "Excluir";
  const edit = label === "Editar";

  const variant = location
    ? "border-transparent bg-[linear-gradient(135deg,#4285F4_0%,#34A853_38%,#FBBC05_68%,#EA4335_100%)] text-white shadow-[0_4px_12px_rgba(66,133,244,0.22)] hover:-translate-y-0.5 hover:shadow-[0_7px_16px_rgba(66,133,244,0.28)]"
    : destructive
      ? "border-[#dc4c4c] bg-[#d94b4b] text-white shadow-[0_4px_12px_rgba(217,75,75,0.20)] hover:-translate-y-0.5 hover:border-[#c83e3e] hover:bg-[#c83e3e] hover:shadow-[0_7px_16px_rgba(217,75,75,0.26)]"
      : edit
        ? "border-[#3678c4] bg-[#3478c9] text-white shadow-[0_4px_12px_rgba(52,120,201,0.20)] hover:-translate-y-0.5 hover:border-[#2868b5] hover:bg-[#2868b5] hover:shadow-[0_7px_16px_rgba(52,120,201,0.26)]"
        : "border-[#c9d9ef] bg-[#f5f9ff] text-[#2f6fb3] hover:border-[#4d8dcc] hover:bg-[#edf5ff] hover:text-[#245d99]";

  return <button type="button" aria-label={label} title={label} onClick={onClick} disabled={disabled} className={`flex size-9 items-center justify-center rounded-xl border transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50 ${variant}`}>{children}</button>;
}

function Status({ active }: { active: boolean }) {
  return <span className={`inline-flex rounded-full px-3 py-1.5 text-[11px] font-semibold ${active ? "bg-[#e8f3e8] text-[#4f7b53]" : "bg-[#fff0f0] text-[#d66a6a]"}`}>{active ? "Ativo" : "Inativo"}</span>;
}

function Empty({ text }: { text: string }) {
  return <div className="flex min-h-[180px] items-center justify-center p-8 text-center text-xs text-[#8c8178]">{text}</div>;
}

function initials(name: string) {
  return name.split(" ").filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
}

function formatPhone(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 11);

  if (digits.length <= 2) return digits.length ? `(${digits}` : "";
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(value));
}

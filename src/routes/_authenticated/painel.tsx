import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Dumbbell, FileText, Home, LogOut, Pencil, Plus, RefreshCw, Settings, Trash2, Users } from "lucide-react";
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
  const [patients, setPatients] = useState<Patient[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [patientCount, setPatientCount] = useState(0);
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

      const [patientsResult, exercisesResult, patientCountResult, exerciseCountResult] = await Promise.all([
        supabase.from("patients").select("*").eq("physiotherapist_id", id).order("created_at", { ascending: false }),
        supabase.from("exercises").select("*").eq("physiotherapist_id", id).order("created_at", { ascending: false }),
        supabase.from("patients").select("id", { count: "exact", head: true }).eq("physiotherapist_id", id).eq("status", "active"),
        supabase.from("exercises").select("id", { count: "exact", head: true }).eq("physiotherapist_id", id).eq("is_active", true),
      ]);

      if (patientsResult.error) throw patientsResult.error;
      if (exercisesResult.error) throw exercisesResult.error;
      if (patientCountResult.error) throw patientCountResult.error;
      if (exerciseCountResult.error) throw exerciseCountResult.error;

      setPatients(patientsResult.data ?? []);
      setExercises(exercisesResult.data ?? []);
      setPatientCount(patientCountResult.count ?? 0);
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

  function openPatientCreate() {
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
        const { data: updatedPatient, error: updateError } = await supabase
          .from("patients")
          .update({
            full_name: patient.full_name.trim(),
            birth_date: patient.birth_date || null,
            sex: patient.sex || null,
            responsible_name: patient.responsible_name.trim() || null,
            responsible_phone: patient.responsible_phone.trim() || null,
            responsible_email: patient.responsible_email.trim() || null,
            notes: patient.notes.trim() || null,
            status: patient.status,
          })
          .eq("id", editingPatient.id)
          .select("*")
          .single();

        if (updateError) throw new Error(updateError.message);
        if (!updatedPatient) throw new Error("O paciente não pôde ser atualizado.");

        setPatients((currentPatients) =>
          currentPatients.map((item) =>
            item.id === updatedPatient.id ? updatedPatient : item,
          ),
        );
        setPatientCount((currentCount) => {
          const wasActive = editingPatient.status === "active";
          const isActive = updatedPatient.status === "active";
          if (wasActive === isActive) return currentCount;
          return isActive ? currentCount + 1 : Math.max(0, currentCount - 1);
        });
        setNotice("");
        setPatientToast(`Paciente "${updatedPatient.full_name}" atualizado com sucesso.`);
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

        setNotice("Paciente cadastrado com sucesso.");
      }

      setModal(null);
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
      const { error: deleteError } = await supabase.from("patients").delete().eq("id", item.id);
      if (deleteError) throw deleteError;
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

      setModal(null);
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
    <main className="min-h-screen bg-[#faf8f4] text-[#2D2823]">
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

        <div className="min-w-0 flex-1 pb-24 lg:pb-0">
          <header className="sticky top-0 z-20 border-b border-[#eee5d9]/90 bg-[#faf8f4]/95 px-4 py-4 backdrop-blur-xl sm:px-6 lg:px-10 lg:py-5">
            <div className="flex items-center justify-between">
              <div><span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#A97A3C]">Painel administrativo</span><h1 className="mt-1 text-[22px] font-semibold tracking-[-0.03em] sm:text-2xl">Olá, Erick</h1></div>
              <button type="button" onClick={logout} className="flex items-center gap-2 rounded-xl border border-[#f0caca] bg-[#fff5f5] px-3 py-2 text-xs font-medium text-[#c94b4b] transition hover:border-[#e58a8a] hover:bg-[#fff0f0] hover:text-[#b83d3d] lg:hidden"><LogOut className="size-4" /> Sair</button>
            </div>
          </header>

          <div className="mx-auto max-w-[1400px] px-4 py-5 sm:px-6 sm:py-7 lg:px-10 lg:py-8">
            {(loading || refreshing) && <div className="mb-5 flex items-center gap-2 rounded-xl border border-[#e6d9c9] bg-white px-4 py-3 text-xs text-[#746c64]"><RefreshCw className="size-4 animate-spin text-[#BA9051]" />Atualizando dados...</div>}
            {error && <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700">{error}</div>}
            {notice && <div className="mb-5 rounded-xl border border-[#dfcfb8] bg-[#fffaf2] px-4 py-3 text-xs text-[#8a6335]">{notice}</div>}

            {tab === "dashboard" && <Dashboard patients={patientCount} exercises={exerciseCount} />}
            {tab === "pacientes" && <Patients patients={patients} onAdd={openPatientCreate} onEdit={openPatientEdit} onDelete={(item) => setConfirmPatient(item)} deleting={deleting} />}
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
            <Field label="Nome completo" value={patient.full_name} onChange={(v) => setPatient({ ...patient, full_name: v })} placeholder="Ex.: Miguel Oliveira" required />
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
            <Field label="Telefone do responsável" value={patient.responsible_phone} onChange={(v) => setPatient({ ...patient, responsible_phone: v })} placeholder="(83) 99999-9999" />
            <Field label="Observações" value={patient.notes} onChange={(v) => setPatient({ ...patient, notes: v })} placeholder="Observações do paciente" multiline />
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
              <label className="flex cursor-pointer items-center justify-between rounded-xl border border-[#e6d8c5] bg-[#fdfbf8] px-4 py-3 transition hover:border-[#cdb894] hover:bg-[#fffaf2]">
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
  return <section className="space-y-6"><div><p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#A97A3C]">Visão geral</p><h2 className="mt-1 text-xl font-semibold sm:text-2xl">Painel</h2><p className="mt-1 text-xs text-[#837970]">Resumo do seu painel administrativo.</p></div><div className="grid gap-4 sm:grid-cols-2"><Summary icon={Users} label="Pacientes ativos" value={patients} /><Summary icon={Dumbbell} label="Exercícios cadastrados" value={exercises} /></div></section>;
}

function Patients({ patients, onAdd, onEdit, onDelete, deleting }: { patients: Patient[]; onAdd: () => void; onEdit: (patient: Patient) => void; onDelete: (patient: Patient) => void; deleting: string | null }) {
  return <section className="space-y-5"><Header title="Pacientes" text="Lista de pacientes cadastrados." action="Cadastrar Paciente" onAction={onAdd} /><div className="overflow-hidden rounded-[1.35rem] border border-[#e6d9c9] bg-white shadow-[0_10px_30px_rgba(64,48,30,0.045)]"><div className="hidden grid-cols-[1.35fr_1fr_1.25fr_0.8fr_110px] gap-4 border-b border-[#eee5d9] bg-[#fdfbf8] px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#9a9087] sm:grid"><span>Paciente</span><span>Responsável</span><span>E-mail do responsável</span><span>Status</span><span>Ações</span></div><div className="divide-y divide-[#f0e8dd]">{patients.length === 0 ? <Empty text="Nenhum paciente cadastrado ainda." /> : patients.map((p) => <div key={p.id} className={`grid grid-cols-[minmax(0,1fr)_auto] gap-2.5 px-3 py-3 sm:grid-cols-[1.35fr_1fr_1.25fr_0.8fr_110px] sm:items-center sm:gap-4 sm:px-5 sm:py-4 ${p.sex === "female" ? "bg-[#fff1f6] hover:bg-[#ffebf2]" : p.sex === "male" ? "bg-[#eff7ff] hover:bg-[#e7f2ff]" : "bg-white hover:bg-[#fdfbf8]"} transition-colors`}><div className="flex min-w-0 items-center gap-2.5"><span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#f3e3cf] text-[11px] font-semibold text-[#8a6335]">{initials(p.full_name)}</span><div className="min-w-0"><p className="truncate text-[14px] font-semibold sm:text-sm">{p.full_name}</p><p className="text-[10px] text-[#948a81] sm:text-[11px]">{formatDate(p.created_at)}</p></div></div><div className="text-[13px] font-medium text-[#5f574f] sm:text-sm"><span className="sm:hidden font-semibold text-[#746c64]">Responsável: </span>{p.responsible_name || "Não informado"}{p.responsible_phone && <span className="block text-[12px] font-normal text-[#8b8178] sm:text-[13px]">{p.responsible_phone}</span>}</div><div className="hidden min-w-0 text-sm text-[#5f574f] sm:block"><p className="truncate" title={p.responsible_email || "Não informado"}>{p.responsible_email || "Não informado"}</p></div><div className="col-span-1 sm:col-span-1"><Status active={p.status === "active"} /></div><div className="row-span-2 flex items-center justify-end gap-1.5 sm:row-span-1 sm:gap-2"><IconButton label="Editar" onClick={() => onEdit(p)}><Pencil className="size-4" /></IconButton><IconButton label="Excluir" onClick={() => onDelete(p)} disabled={deleting === p.id}>{deleting === p.id ? <RefreshCw className="size-4 animate-spin" /> : <Trash2 className="size-4" />}</IconButton></div></div>)}</div></div></section>;
}

function Exercises({ exercises, onAdd, onEdit, onDelete, deleting }: { exercises: Exercise[]; onAdd: () => void; onEdit: (exercise: Exercise) => void; onDelete: (exercise: Exercise) => void; deleting: string | null }) {
  return <section className="space-y-5"><Header title="Exercícios" text="Lista de exercícios cadastrados." action="Adicionar exercício" onAction={onAdd} /><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{exercises.length === 0 ? <div className="md:col-span-2 xl:col-span-3"><Empty text="Nenhum exercício cadastrado ainda." /></div> : exercises.map((e) => <article key={e.id} className="rounded-[1.35rem] border border-[#e6d9c9] bg-white p-5 shadow-[0_10px_30px_rgba(64,48,30,0.045)]"><div className="flex items-start gap-3"><span className="flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[#f3e3cf] text-[#A97A3C]">{e.thumbnail_url ? <img src={e.thumbnail_url} alt="" className="size-full object-cover" /> : <Dumbbell className="size-5" />}</span><div className="min-w-0"><h3 className="truncate text-sm font-semibold">{e.name}</h3><span className="mt-1 inline-flex rounded-full bg-[#BA9051]/10 px-2 py-1 text-[9px] text-[#A97A3C]">{e.type}</span></div></div><p className="mt-4 min-h-10 text-xs leading-relaxed text-[#81776e]">{e.description || "Sem descrição."}</p><div className="mt-4 flex items-center justify-between"><Status active={e.is_active} /><div className="flex gap-2"><IconButton label="Editar" onClick={() => onEdit(e)}><Pencil className="size-4" /></IconButton><IconButton label="Excluir" onClick={() => onDelete(e)} disabled={deleting === e.id}>{deleting === e.id ? <RefreshCw className="size-4 animate-spin" /> : <Trash2 className="size-4" />}</IconButton></div></div></article>)}</div></section>;
}

function Header({ title, text, action, onAction }: { title: string; text: string; action: string; onAction: () => void }) {
  return <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#A97A3C]">Gestão</p><h2 className="mt-1 text-xl font-semibold sm:text-2xl">{title}</h2><p className="mt-1 text-xs text-[#837970]">{text}</p></div><Button onClick={onAction} className="h-10 rounded-xl bg-[#BA9051] text-xs font-semibold hover:bg-[#A97A3C]"><Plus className="size-4" />{action}</Button></div>;
}

function Summary({ icon: Icon, label, value }: { icon: typeof Users; label: string; value: number }) {
  return <div className="rounded-[1.35rem] border border-[#e6d9c9] bg-white p-5 shadow-[0_10px_30px_rgba(64,48,30,0.05)] sm:p-6"><span className="flex size-10 items-center justify-center rounded-xl bg-[#BA9051]/10 text-[#BA9051]"><Icon className="size-[18px]" /></span><p className="mt-5 text-[10px] font-medium uppercase tracking-[0.12em] text-[#948a81]">{label}</p><p className="mt-1 text-[30px] font-semibold">{value}</p></div>;
}

function Placeholder({ icon: Icon, title, text }: { icon: typeof FileText; title: string; text: string }) {
  return <section className="space-y-5"><div><p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#A97A3C]">Sistema</p><h2 className="mt-1 text-xl font-semibold sm:text-2xl">{title}</h2></div><div className="flex min-h-[280px] flex-col items-center justify-center rounded-[1.35rem] border border-dashed border-[#dccbb5] bg-white p-8 text-center"><Icon className="size-6 text-[#BA9051]" /><h3 className="mt-4 text-sm font-semibold">{title}</h3><p className="mt-1 text-xs text-[#8c8178]">{text}</p></div></section>;
}

function Modal({ title, close, children }: { title: string; close: () => void; children: ReactNode }) {
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#2D2823]/30 p-4 backdrop-blur-sm" onClick={(e) => e.target === e.currentTarget && close()}><div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-[1.5rem] border border-[#e3d3bd] bg-white p-5 shadow-[0_25px_80px_rgba(64,48,30,0.2)] sm:p-6 lg:max-w-2xl lg:p-7 xl:max-w-3xl"><div className="mb-5 flex items-center justify-between"><h2 className="text-lg font-semibold">{title}</h2><button type="button" onClick={close} className="size-8 rounded-lg text-xl text-[#91877e]">×</button></div>{children}</div></div>;
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
  const className="w-full rounded-xl border border-[#e6d8c5] bg-[#fdfbf8] px-3 text-sm outline-none focus:border-[#BA9051] focus:ring-2 focus:ring-[#BA9051]/10";
  return <label className="block"><span className="mb-1.5 block text-[11px] font-medium text-[#746c64]">{label}</span>{multiline ? <textarea value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} required={required} rows={3} className={`${className} min-h-24 py-3 resize-none`} /> : <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} required={required} className={`${className} h-11`} />}</label>;
}

function SelectField({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: [string, string][] }) {
  return <label className="block"><span className="mb-1.5 block text-[11px] font-medium text-[#746c64]">{label}</span><select value={value} onChange={(e) => onChange(e.target.value)} className="h-11 w-full rounded-xl border border-[#e6d8c5] bg-[#fdfbf8] px-3 text-sm outline-none focus:border-[#BA9051] focus:ring-2 focus:ring-[#BA9051]/10">{options.map(([optionValue, optionLabel]) => <option key={optionValue} value={optionValue}>{optionLabel}</option>)}</select></label>;
}

function Actions({ close, label, loading }: { close: () => void; label: string; loading: boolean }) {
  return <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end"><Button type="button" variant="outline" onClick={close} disabled={loading} className="h-10 rounded-xl text-xs">Cancelar</Button><Button type="submit" disabled={loading} className="h-10 rounded-xl bg-[#BA9051] text-xs font-semibold hover:bg-[#A97A3C]">{loading ? <RefreshCw className="size-4 animate-spin" /> : null}{loading ? "Salvando..." : label}</Button></div>;
}

function IconButton({ label, onClick, disabled, children }: { label: string; onClick: () => void; disabled?: boolean; children: ReactNode }) {
  const destructive = label === "Excluir";
  return <button type="button" aria-label={label} title={label} onClick={onClick} disabled={disabled} className={`flex size-9 items-center justify-center rounded-lg border transition disabled:opacity-50 ${destructive ? "border-[#f0caca] bg-[#fff5f5] text-[#d34f4f] hover:border-[#e58a8a] hover:bg-[#fff0f0] hover:text-[#b93838]" : "border-[#c9d9ef] bg-[#f5f9ff] text-[#2f6fb3] hover:border-[#4d8dcc] hover:bg-[#edf5ff] hover:text-[#245d99]"}`}>{children}</button>;
}

function Status({ active }: { active: boolean }) {
  return <span className={`inline-flex rounded-full px-3 py-1.5 text-[11px] font-semibold ${active ? "bg-[#e8f3e8] text-[#4f7b53]" : "bg-[#f1ece7] text-[#81776e]"}`}>{active ? "Ativo" : "Inativo"}</span>;
}

function Empty({ text }: { text: string }) {
  return <div className="flex min-h-[180px] items-center justify-center p-8 text-center text-xs text-[#8c8178]">{text}</div>;
}

function initials(name: string) {
  return name.split(" ").filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(value));
}

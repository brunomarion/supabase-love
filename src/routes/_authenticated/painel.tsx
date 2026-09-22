import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight, Dumbbell, FileText, Home, LogOut, MapPin, Pencil, Play, Plus, RefreshCw, Search, Settings, SlidersHorizontal, Trash2, UserRound, Users, X } from "lucide-react";
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
  const [exerciseToast, setExerciseToast] = useState("");
  const [modal, setModal] = useState<"patient" | "exercise" | null>(null);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [editingExercise, setEditingExercise] = useState<Exercise | null>(null);
  const [viewingExercise, setViewingExercise] = useState<Exercise | null>(null);
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
    if (!exerciseToast) return;
    const timer = window.setTimeout(() => setExerciseToast(""), 4000);
    return () => window.clearTimeout(timer);
  }, [exerciseToast]);

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
      sex: (item.sex ?? "") as "" | "male" | "female",
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
      status: item.status as "active" | "inactive",
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
          .eq("physiotherapist_id", physiotherapistId!);

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

        const { data: createData, error: functionError } = await supabase.functions.invoke("criar_paciente", {
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

        if (createData?.error) {
          throw new Error(createData.error);
        }

        let createdPatient = createData?.patient as Patient | undefined;

        if (!createdPatient?.id) {
          const { data: queriedPatient, error: queryError } = await supabase
            .from("patients")
            .select("*")
            .eq("physiotherapist_id", physiotherapistId)
            .eq("responsible_email", patient.responsible_email.trim())
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();

          if (queryError) throw queryError;
          createdPatient = queriedPatient ?? undefined;
        }

        if (createdPatient?.id) {
          const address = {
            cep: patient.cep.trim() || null,
            street: patient.street.trim() || null,
            number: patient.number.trim() || null,
            complement: patient.complement.trim() || null,
            neighborhood: patient.neighborhood.trim() || null,
            city: patient.city.trim() || null,
            state: patient.state.trim().toUpperCase() || null,
          };

          const { error: addressUpdateError } = await supabase
            .from("patients")
            .update(address)
            .eq("id", createdPatient.id)
            .eq("physiotherapist_id", physiotherapistId);

          if (addressUpdateError) throw addressUpdateError;

          const patientForList = { ...createdPatient, ...address } as Patient;
          setPatients((currentPatients) => [
            patientForList,
            ...currentPatients.filter((item) => item.id !== patientForList.id),
          ]);
          setPatientCount((count) => count + 1);
          if (patientForList.status === "active") {
            setActivePatientCount((count) => count + 1);
          }
        }

        setNotice("Paciente cadastrado com sucesso.");
        setPatientToast(`Paciente "${patient.full_name.trim()}" cadastrado com sucesso.`);
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
      setNotice("");
      setExerciseToast(`Vídeo "${item.name}" excluído com sucesso.`);
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
          <div className="pointer-events-auto flex w-full max-w-[460px] items-center gap-4 rounded-[1.25rem] border border-[#dcc29a] bg-white/98 px-5 py-4 shadow-[0_20px_55px_rgba(64,48,30,0.20)] backdrop-blur-xl animate-in slide-in-from-top-3 duration-300">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-full border border-[#e5cfa9] bg-[#faf2e5] text-[#A97A3C] shadow-[0_4px_12px_rgba(186,144,81,0.12)]">
              <span className="text-lg font-bold">✓</span>
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#A97A3C]">{patientToast.startsWith("Paciente \"") && patientToast.includes("cadastrado com sucesso") ? "Criação feita" : "Atualização"}</p>
              <p className="mt-1 text-[13px] font-medium leading-relaxed text-[#4f4841] sm:text-sm">{patientToast}</p>
            </div>
            <button type="button" onClick={() => setPatientToast("")} className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-[#eadcc8] text-[#91877e] transition hover:border-[#d8c09a] hover:bg-[#faf5ed] hover:text-[#A97A3C]" aria-label="Fechar mensagem">×</button>
          </div>
        </div>
      )}
      {exerciseToast && (
        <div className="fixed inset-x-4 top-4 z-[80] flex justify-center pointer-events-none sm:inset-x-auto sm:right-6 sm:top-6">
          <div className="pointer-events-auto flex w-full max-w-[460px] items-center gap-4 rounded-[1.25rem] border border-[#dcc29a] bg-white/98 px-5 py-4 shadow-[0_20px_55px_rgba(64,48,30,0.20)] backdrop-blur-xl animate-in slide-in-from-top-3 duration-300">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-full border border-[#e5cfa9] bg-[#faf2e5] text-[#A97A3C] shadow-[0_4px_12px_rgba(186,144,81,0.12)]">
              <span className="text-lg font-bold">✓</span>
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#A97A3C]">Exclusão feita</p>
              <p className="mt-1 text-[13px] font-medium leading-relaxed text-[#4f4841] sm:text-sm">{exerciseToast}</p>
            </div>
            <button type="button" onClick={() => setExerciseToast("")} className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-[#eadcc8] text-[#91877e] transition hover:border-[#d8c09a] hover:bg-[#faf5ed] hover:text-[#A97A3C]" aria-label="Fechar mensagem">×</button>
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
            {tab === "exercicios" && <Exercises exercises={exercises} onAdd={openExerciseCreate} onEdit={openExerciseEdit} onDelete={removeExercise} onView={setViewingExercise} deleting={deleting} />}
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

      {viewingExercise && <ExerciseVideoModal exercise={viewingExercise} close={() => setViewingExercise(null)} />}

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

      {modal === "exercise" && <Modal title={editingExercise ? "Editar exercício" : "Cadastrar Exercício"} close={() => !saving && setModal(null)}>
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
  const [showFilters, setShowFilters] = useState(false);

  const Filter = () => (
    <div className="flex items-center gap-2 rounded-2xl border border-[#e6d8c5] bg-white/95 px-3 py-2.5 shadow-[0_6px_20px_rgba(64,48,30,0.07)]">
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
                <Button type="button" onClick={onAdd} className="h-[50px] w-full rounded-xl bg-[#BA9051] px-3 text-[16px] font-semibold text-white shadow-[0_6px_18px_rgba(186,144,81,0.18)] transition-colors hover:bg-[#A97A3C]"><Plus className="size-3.5" />Novo Paciente</Button>
                <div className="flex h-[44px] w-full items-center gap-2 rounded-xl border border-[#dfc28f] bg-white/95 px-3 py-2 shadow-[0_6px_20px_rgba(186,144,81,0.12)]">
                  <span className="text-[18px] font-semibold tracking-[-0.03em] text-[#BA9051]">{patientCount}</span>
                  <span className="text-[9px] font-semibold uppercase tracking-[0.08em] text-[#948a81]">pacientes cadastrados</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 lg:gap-4">
          <div className="hidden items-center gap-2 rounded-xl border border-[#dfc28f] bg-white/95 px-3 py-2 shadow-[0_6px_20px_rgba(186,144,81,0.12)] lg:flex">
            <span className="text-[18px] font-semibold tracking-[-0.03em] text-[#BA9051]">{patientCount}</span>
            <span className="text-[9px] font-semibold uppercase tracking-[0.08em] text-[#948a81]">pacientes cadastrados</span>
          </div>
          <div className="hidden items-center gap-4 lg:flex">
            <Filter />
            <Button type="button" onClick={onAdd} className="h-10 w-[190px] justify-center rounded-xl bg-[#BA9051] px-4 text-[13px] font-semibold shadow-[0_6px_18px_rgba(186,144,81,0.18)] transition-colors hover:bg-[#A97A3C]"><Plus className="size-4" />Novo Paciente</Button>
          </div>
        </div>
      </div>
      <div className="-mt-3 relative rounded-2xl border border-[#e6d9c9] bg-white p-2 shadow-[0_6px_20px_rgba(64,48,30,0.045)] lg:mt-0">
        <label className="relative flex h-11 items-center gap-2.5 rounded-xl border border-[#e6d9c9] bg-[#fdfbf8] px-3 pr-12 text-[#837970] sm:pr-12 lg:pr-3 focus-within:border-[#BA9051] focus-within:ring-2 focus-within:ring-[#BA9051]/10 sm:pr-[5.5rem]">
          <Search className="size-[17px] shrink-0 text-[#BA9051]" strokeWidth={1.8} />
          <input type="search" value={patientSearch} onChange={(e) => setPatientSearch(e.target.value)} placeholder="Pesquisar paciente, responsável, e-mail ou telefone..." aria-label="Pesquisar pacientes" className="min-w-0 flex-1 bg-transparent text-base text-[#403a35] outline-none placeholder:text-[#a79d94] sm:text-sm" />
        </label>
        {patientSearch && <button type="button" onClick={() => setPatientSearch("")} aria-label="Limpar pesquisa" className="absolute right-12 top-1/2 sm:right-12 lg:right-2 flex size-7 -translate-y-1/2 items-center justify-center rounded-lg text-[#91877e] transition hover:bg-[#f2ece4] hover:text-[#A97A3C]"><X className="size-4" /></button>}
        <button type="button" onClick={() => setShowFilters((open) => !open)} aria-label="Filtrar pacientes" aria-expanded={showFilters} className={`absolute right-3 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-lg transition ${statusFilter !== "all" ? "bg-[#f3e3cf] text-[#A97A3C]" : "text-[#8b8178] hover:bg-[#f5eee5] hover:text-[#A97A3C]"}`}>
          <SlidersHorizontal className="size-4" />
          {statusFilter !== "all" && <span className="absolute right-0.5 top-0.5 size-1.5 rounded-full bg-[#BA9051]" />}
        </button>
        {showFilters && (
          <div className="absolute right-2 top-[calc(100%+0.5rem)] z-30 w-[min(82vw,280px)] sm:right-2 lg:hidden overflow-hidden rounded-2xl border border-[#e3d3bd] bg-white p-2 shadow-[0_18px_45px_rgba(45,40,35,0.16)]">
            <div className="px-3 py-2">
              <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-[#A97A3C]">Filtrar por status</p>
              <p className="mt-0.5 text-[10px] text-[#948a81]">Escolha quais pacientes deseja visualizar.</p>
            </div>
            <div className="space-y-0.5">
              {[
                ["all", "Todos"],
                ["active", "Ativos"],
                ["inactive", "Inativos"],
              ].map(([value, label]) => (
                <button key={value} type="button" onClick={() => { onStatusFilterChange(value as "all" | "active" | "inactive"); setShowFilters(false); }} className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-xs font-medium transition ${statusFilter === value ? "bg-[#f5eee5] text-[#A97A3C]" : "text-[#5f574f] hover:bg-[#faf7f2]"}`}>
                  <span>{label}</span>
                  {statusFilter === value && <span className="text-[10px] font-semibold">✓</span>}
                </button>
              ))}
            </div>
          </div>
        )}
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
function Exercises({ exercises, onAdd, onEdit, onDelete, onView, deleting }: { exercises: Exercise[]; onAdd: () => void; onEdit: (exercise: Exercise) => void; onDelete: (exercise: Exercise) => void; onView: (exercise: Exercise) => void; deleting: string | null }) {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const pageSize = 3;

  const exerciseTypes = Array.from(
    new Set(exercises.map((exercise) => exercise.type?.trim()).filter(Boolean)),
  );

  const filteredExercises = exercises.filter((exercise) => {
    const term = search.trim().toLowerCase();
    const matchesType =
      typeFilter === "all" ||
      (exercise.type?.trim() || "Sem tipo").toLowerCase() === typeFilter.toLowerCase();

    if (!matchesType) return false;
    if (!term) return true;

    return [exercise.name, exercise.description, exercise.type]
      .filter(Boolean)
      .some((value) => value!.toLowerCase().includes(term));
  });

  useEffect(() => {
    setPage(1);
  }, [search, typeFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredExercises.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedExercises = filteredExercises.slice(startIndex, startIndex + pageSize);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  return <section className="space-y-5">
    <div className="space-y-3">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex min-w-0 items-center justify-between gap-4 lg:block">
          <div className="min-w-0">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#A97A3C]">Gestão</p>
                <h2 className="mt-1 text-xl font-semibold sm:text-2xl">Exercícios</h2>
                <p className="mt-1 text-xs text-[#837970]">Biblioteca de exercícios em vídeo.</p>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1.5 lg:hidden">
                <Button type="button" onClick={onAdd} className="h-[50px] w-full rounded-xl bg-[#BA9051] px-3 text-[16px] font-semibold text-white shadow-[0_6px_18px_rgba(186,144,81,0.18)] transition-colors hover:bg-[#A97A3C]"><Plus className="size-3.5" />Cadastrar Exercício</Button>
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 lg:gap-4">
          <div className="hidden items-center gap-4 lg:flex">
            <Button type="button" onClick={onAdd} className="h-10 rounded-xl bg-[#BA9051] px-4 text-[13px] font-semibold shadow-[0_6px_18px_rgba(186,144,81,0.18)] transition-colors hover:bg-[#A97A3C]"><Plus className="size-4" />Cadastrar Exercício</Button>
          </div>
        </div>
      </div>
    </div>
    <div className="relative -mt-5 w-full lg:mt-0">
      <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-[#A97A3C]" />
      <input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Pesquisar exercício..." aria-label="Pesquisar exercícios" className="h-11 w-full rounded-xl border border-[#e6d8c5] bg-white pl-10 pr-[5.5rem] text-base text-[#302b26] shadow-[0_6px_18px_rgba(64,48,30,0.04)] outline-none transition-all duration-200 placeholder:text-[#a59b92] focus:border-[#BA9051] focus:ring-2 focus:ring-[#BA9051]/10 sm:pr-10 sm:text-sm" />
      {search && <button type="button" onClick={() => setSearch("")} aria-label="Limpar pesquisa" className="absolute right-12 top-1/2 hidden size-6 -translate-y-1/2 items-center justify-center rounded-full text-[#8b8178] transition hover:bg-[#f4ece1] hover:text-[#A97A3C] sm:flex"><X className="size-4" /></button>}
      <button
        type="button"
        onClick={() => setShowFilters((open) => !open)}
        aria-label="Filtrar exercícios"
        aria-expanded={showFilters}
        className={`absolute right-2 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-lg transition sm:hidden ${typeFilter !== "all" ? "bg-[#f3e3cf] text-[#A97A3C]" : "text-[#8b8178] hover:bg-[#f5eee5] hover:text-[#A97A3C]"}`}
      >
        <SlidersHorizontal className="size-4" />
        {typeFilter !== "all" && <span className="absolute right-0.5 top-0.5 size-1.5 rounded-full bg-[#BA9051]" />}
      </button>
      {search && <button type="button" onClick={() => setSearch("")} aria-label="Limpar pesquisa" className="absolute right-12 top-1/2 flex size-6 -translate-y-1/2 items-center justify-center rounded-full text-[#8b8178] transition hover:bg-[#f4ece1] hover:text-[#A97A3C] sm:hidden"><X className="size-4" /></button>}
      {showFilters && (
        <div className="absolute right-0 top-[calc(100%+0.5rem)] z-30 w-[min(82vw,280px)] overflow-hidden rounded-2xl border border-[#e3d3bd] bg-white p-2 shadow-[0_18px_45px_rgba(45,40,35,0.16)] sm:hidden">
          <div className="px-3 py-2">
            <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-[#A97A3C]">Filtrar por tipo</p>
            <p className="mt-0.5 text-[10px] text-[#948a81]">Escolha o tipo de exercício.</p>
          </div>
          <div className="max-h-52 overflow-y-auto">
            <button type="button" onClick={() => { setTypeFilter("all"); setShowFilters(false); }} className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-xs font-medium transition ${typeFilter === "all" ? "bg-[#f5eee5] text-[#A97A3C]" : "text-[#5f574f] hover:bg-[#faf7f2]"}`}>
              <span>Todos</span>
              {typeFilter === "all" && <span className="text-[10px] font-semibold">✓</span>}
            </button>
            {exerciseTypes.map((type) => (
              <button key={type} type="button" onClick={() => { setTypeFilter(type); setShowFilters(false); }} className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-xs font-medium transition ${typeFilter.toLowerCase() === type.toLowerCase() ? "bg-[#f5eee5] text-[#A97A3C]" : "text-[#5f574f] hover:bg-[#faf7f2]"}`}>
                <span className="truncate">{type}</span>
                {typeFilter.toLowerCase() === type.toLowerCase() && <span className="text-[10px] font-semibold">✓</span>}
              </button>
            ))}
            {exercises.some((exercise) => !exercise.type?.trim()) && (
              <button type="button" onClick={() => { setTypeFilter("Sem tipo"); setShowFilters(false); }} className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-xs font-medium transition ${typeFilter.toLowerCase() === "sem tipo" ? "bg-[#f5eee5] text-[#A97A3C]" : "text-[#5f574f] hover:bg-[#faf7f2]"}`}>
                <span>Sem tipo</span>
                {typeFilter.toLowerCase() === "sem tipo" && <span className="text-[10px] font-semibold">✓</span>}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
    <div className="-mx-1 overflow-hidden sm:mx-0 sm:overflow-visible">
      {exercises.length === 0 ? <div className="sm:col-span-2 xl:col-span-3"><Empty text="Nenhum exercício cadastrado ainda." /></div> : filteredExercises.length === 0 ? <div className="rounded-[1.2rem] border border-dashed border-[#dccbb5] bg-white p-8 text-center text-xs text-[#8c8178]">Nenhum exercício encontrado para sua pesquisa.</div> : <>
        <div className="relative rounded-[1.35rem] border border-[#e6d9c9] bg-white p-2 shadow-[0_10px_30px_rgba(64,48,30,0.045)] sm:p-3">
          <button type="button" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={currentPage === 1} aria-label="Exercícios anteriores" className="absolute left-2 top-1/2 z-10 hidden size-10 -translate-y-1/2 items-center justify-center rounded-full border border-[#dfd2c1] bg-white/95 text-[#746c64] shadow-[0_8px_22px_rgba(64,48,30,0.14)] backdrop-blur-sm transition hover:border-[#BA9051] hover:bg-[#fffaf2] hover:text-[#A97A3C] disabled:cursor-not-allowed disabled:opacity-30 lg:flex">
            <ChevronLeft className="size-5" />
          </button>
          <button type="button" onClick={() => setPage((current) => Math.min(totalPages, current + 1))} disabled={currentPage === totalPages} aria-label="Próximos exercícios" className="absolute right-2 top-1/2 z-10 hidden size-10 -translate-y-1/2 items-center justify-center rounded-full border border-[#dfd2c1] bg-white/95 text-[#746c64] shadow-[0_8px_22px_rgba(64,48,30,0.14)] backdrop-blur-sm transition hover:border-[#BA9051] hover:bg-[#fffaf2] hover:text-[#A97A3C] disabled:cursor-not-allowed disabled:opacity-30 lg:flex">
            <ChevronRight className="size-5" />
          </button>
          <div className="flex gap-4 overflow-x-auto pb-3 snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:grid sm:grid-cols-2 sm:gap-5 sm:overflow-y-visible sm:overflow-x-hidden sm:px-1 sm:pb-1 sm:snap-none xl:grid-cols-3 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-track]:bg-[#f3ede5] [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[#c9ad82] hover:[&::-webkit-scrollbar-thumb]:bg-[#A97A3C]">
            {filteredExercises.map((e, index) => <article data-exercise-card key={e.id} className={`group w-[78vw] max-w-[270px] shrink-0 snap-center overflow-hidden rounded-[1.2rem] border border-[#e6d9c9] bg-white shadow-[0_10px_30px_rgba(64,48,30,0.055)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_18px_42px_rgba(64,48,30,0.11)] sm:w-auto sm:max-w-none sm:shrink sm:snap-none sm:rounded-[1.35rem] xl:w-full xl:max-w-none ${index >= startIndex && index < startIndex + pageSize ? "" : "lg:hidden"}`}>
              <button type="button" onClick={() => onView(e)} className="relative block aspect-video w-full overflow-hidden bg-[linear-gradient(145deg,#f7eee2,#ead9bf)] text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[#BA9051] focus-visible:ring-inset touch-manipulation">
                {e.thumbnail_url ? <img src={e.thumbnail_url} alt={"Capa do exercício " + e.name} className="size-full object-cover transition-transform duration-500 group-hover:scale-[1.035]" /> : <div className="flex size-full items-center justify-center"><Dumbbell className="size-12 text-[#BA9051]/45" /></div>}
                <div className="absolute inset-0 bg-gradient-to-t from-[#2d2823]/45 via-transparent to-transparent" />
                <span className="absolute left-3 top-3 rounded-full border border-white/30 bg-[#2d2823]/55 px-2 py-1 text-[8px] font-semibold uppercase tracking-[0.12em] text-white backdrop-blur-md sm:left-4 sm:top-4 sm:px-2.5 sm:py-1 sm:text-[9px]">{e.type || "Vídeo"}</span>
                <span className="absolute left-1/2 top-1/2 flex size-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white/70 bg-white/90 text-[#A97A3C] shadow-[0_10px_28px_rgba(45,40,35,0.25)] transition-transform duration-300 group-hover:scale-110 sm:size-12"><Play className="ml-0.5 size-5 fill-current" /></span>
              </button>
              <div className="p-4 sm:p-5">
                <h3 className="truncate text-sm font-semibold text-[#302b26]">{e.name}</h3>
                <p className="mt-1.5 line-clamp-2 min-h-9 text-xs leading-relaxed text-[#81776e]">{e.description || "Exercício em vídeo."}</p>
                <div className="mt-3 flex items-center justify-end gap-3 sm:mt-4"><div className="flex gap-2"><IconButton label="Editar" onClick={() => onEdit(e)}><Pencil className="size-4" /></IconButton><IconButton label="Excluir" onClick={() => onDelete(e)} disabled={deleting === e.id}>{deleting === e.id ? <RefreshCw className="size-4 animate-spin" /> : <Trash2 className="size-4" />}</IconButton></div></div>
              </div>
            </article>)}
          </div>
        </div>
        {filteredExercises.length > 0 && <div className="hidden items-center justify-center border-t border-[#eee5d9] bg-[#fdfbf8] px-3 py-2.5 sm:flex sm:px-5">
          <span className="text-[10px] text-[#948a81]">{startIndex + 1}–{Math.min(startIndex + pageSize, filteredExercises.length)} de {filteredExercises.length}</span>
        </div>}
      </>}
    </div>
  </section>;
}
function getVideoEmbedUrl(url: string | null) {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, "").toLowerCase();
    if (host === "youtu.be") {
      const id = parsed.pathname.slice(1).split("/")[0];
      return id ? "https://www.youtube.com/embed/" + id + "?rel=0" : null;
    }
    if (host === "youtube.com" || host === "m.youtube.com") {
      const id = parsed.searchParams.get("v") || parsed.pathname.match(/\/(?:shorts|embed)\/([^/?]+)/)?.[1];
      return id ? "https://www.youtube.com/embed/" + id + "?rel=0" : null;
    }
    if (host === "vimeo.com" || host === "player.vimeo.com") {
      const id = parsed.pathname.match(/\/(?:video\/)?(\d+)/)?.[1];
      return id ? "https://player.vimeo.com/video/" + id : null;
    }
    return url;
  } catch { return null; }
}

function ExerciseVideoModal({ exercise, close }: { exercise: Exercise; close: () => void }) {
  const embedUrl = getVideoEmbedUrl(exercise.video_url);
  return <div className="fixed inset-0 z-[70] flex items-center justify-center overflow-hidden bg-[#2D2823]/55 p-3 backdrop-blur-sm sm:p-5" onClick={(e) => e.target === e.currentTarget && close()}><div className="max-h-[calc(100dvh-1.5rem)] w-full max-w-4xl overflow-y-auto overscroll-contain rounded-[1.5rem] border border-[#e3d3bd] bg-white shadow-[0_30px_100px_rgba(45,40,35,0.32)] sm:max-h-[calc(100dvh-2.5rem)]"><div className="flex items-center justify-between gap-4 border-b border-[#eee5d9] px-4 py-3 sm:px-5 sm:py-4"><div className="min-w-0"><p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-[#A97A3C]">{exercise.type || "Vídeo"}</p><h2 className="mt-0.5 truncate text-base font-semibold text-[#302b26] sm:text-lg">{exercise.name}</h2></div><button type="button" onClick={close} className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-[#e2cfb4] bg-[#fffdf9] text-[#746c64] transition hover:border-[#BA9051] hover:bg-[#f8f0e5] hover:text-[#A97A3C]" aria-label="Fechar vídeo"><X className="size-5" /></button></div><div className="bg-[#171412]">{embedUrl ? <div className="aspect-video w-full"><iframe src={embedUrl} title={exercise.name} className="size-full border-0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen /></div> : <div className="flex aspect-video items-center justify-center p-6 text-center text-sm text-white/70">Este exercício ainda não possui um link de vídeo válido.</div>}</div><div className="px-5 py-4 sm:px-6 sm:py-5"><p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#A97A3C]">Orientações</p><p className="mt-2 text-sm leading-relaxed text-[#746c64]">{exercise.description || "Nenhuma orientação cadastrada para este exercício."}</p></div></div></div>;
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

function Field({ label, value, onChange, placeholder, required, type = "text", multiline = false, inputMode }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string; inputMode?: "text" | "tel" | "numeric" | "email"; required?: boolean; type?: string; multiline?: boolean }) {
  const className="w-full rounded-xl border border-[#e6d8c5] bg-[#fdfbf8] px-3 text-base sm:text-sm outline-none focus:border-[#BA9051] focus:ring-2 focus:ring-[#BA9051]/10";
  return <label className="block"><span className="mb-1.5 block text-[11px] font-medium text-[#746c64]">{label}</span>{multiline ? <textarea value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} required={required} rows={3} className={`${className} min-h-24 py-3 resize-none`} /> : <input type={type} inputMode={inputMode} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} required={required} className={`${className} h-11`} />}</label>;
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

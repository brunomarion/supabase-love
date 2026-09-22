import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";
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
  const [isFirstDashboardEntry, setIsFirstDashboardEntry] = useState(true);
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
  const [confirmExercise, setConfirmExercise] = useState<Exercise | null>(null);
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
    const timer = window.setTimeout(() => setIsFirstDashboardEntry(false), 1400);
    return () => window.clearTimeout(timer);
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
    try {
      setDeleting(item.id);
      const { error: deleteError } = await supabase.from("exercises").delete().eq("id", item.id);
      if (deleteError) throw deleteError;
      setConfirmExercise(null);
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
    <main className={`h-screen overflow-hidden text-[#2D2823] lg:bg-[#faf8f4] ${tab === "dashboard" ? "bg-[linear-gradient(to_top,#c09a66_0%,#ffffff_78%,#ffffff_100%)]" : "bg-[#faf8f4]"}`}>
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
              <button key={id} type="button" onClick={() => setTab(id)} data-active={tab === id ? "true" : "false"} className={`premium-tab-button flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-[13px] font-medium transition ${tab === id ? "bg-[#BA9051]/10 text-[#A97A3C] shadow-[inset_3px_0_0_#BA9051]" : "text-[#746C64] hover:bg-[#faf7f2] hover:text-[#2D2823]"}`}>
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
          <header className={`sticky top-0 z-20 border-b border-[#eee5d9]/90 px-4 py-3 backdrop-blur-xl sm:px-6 lg:hidden ${tab === "dashboard" ? "bg-white" : "bg-[#faf8f4]/95"}`}>
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
            {refreshing && <div className="mb-5 flex items-center gap-2 rounded-xl border border-[#e6d9c9] bg-white px-4 py-3 text-xs text-[#746c64]"><RefreshCw className="size-4 animate-spin text-[#BA9051]" />Atualizando dados...</div>}
            {error && <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700">{error}</div>}
            {notice && <div className="mb-5 rounded-xl border border-[#dfcfb8] bg-[#fffaf2] px-4 py-3 text-xs text-[#8a6335]">{notice}</div>}

            <motion.div key={tab} className="premium-tab-content" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.36, ease: "easeOut" }}>
              {tab === "dashboard" && <Dashboard patients={activePatientCount} exercises={exerciseCount} animateFirstEntry={isFirstDashboardEntry} />}
              {tab === "pacientes" && <Patients patients={patients} patientCount={patientCount} onAdd={openPatientCreate} onEdit={openPatientEdit} onDelete={(item) => setConfirmPatient(item)} onMap={openPatientMap} deleting={deleting} statusFilter={patientStatusFilter} onStatusFilterChange={setPatientStatusFilter} />}
              {tab === "exercicios" && <Exercises exercises={exercises} onAdd={openExerciseCreate} onEdit={openExerciseEdit} onDelete={(item) => setConfirmExercise(item)} onView={setViewingExercise} deleting={deleting} />}
              {tab === "relatorios" && <Placeholder icon={FileText} title="Relatórios" text="Área destinada aos relatórios clínicos e administrativos." />}
              {tab === "configuracoes" && <Placeholder icon={Settings} title="Configurações" text="Área destinada às configurações do sistema." />}
            </motion.div>
          </div>
        </div>
      </div>

      <nav className="fixed inset-x-3 bottom-3 z-30 grid grid-cols-5 items-stretch gap-1 rounded-2xl border border-[#dfd0bb] bg-white/95 px-2 py-2 shadow-[0_14px_40px_rgba(64,48,30,0.16)] backdrop-blur-xl lg:hidden">
        {nav.map(({ id, label, icon: Icon }) => (
          <button key={id} type="button" onClick={() => setTab(id)} data-active={tab === id ? "true" : "false"} className={`premium-tab-button flex min-w-0 flex-col items-center justify-center gap-1 rounded-xl px-1 py-2 text-[9px] font-medium transition ${tab === id ? "bg-[#BA9051]/10 text-[#A97A3C]" : "text-[#8e857c] hover:bg-[#faf7f2]"}`}>
            <Icon className="size-[18px]" strokeWidth={1.8} /><span className="truncate">{label}</span>
          </button>
        ))}
      </nav>

      <AnimatePresence mode="wait">
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

      {confirmPatient && <DeletePatientModal patient={confirmPatient} loading={deleting === confirmPatient.id} close={() => !deleting && setConfirmPatient(null)} confirm={() => void removePatient(confirmPatient)} />}\n\n      {confirmExercise && <DeleteExerciseModal exercise={confirmExercise} loading={deleting === confirmExercise.id} close={() => !deleting && setConfirmExercise(null)} confirm={() => void removeExercise(confirmExercise)} />}

      {modal === "exercise" && <Modal title={editingExercise ? "Editar exercício" : "Cadastrar Exercício"} close={() => !saving && setModal(null)}>
        <form onSubmit={saveExercise} className="space-y-4">
          <Field label="Nome do exercício" value={exercise.name} onChange={(v) => setExercise({ ...exercise, name: v })} placeholder="Ex.: Estimulação cervical" required />
          <Field label="Descrição" value={exercise.description} onChange={(v) => setExercise({ ...exercise, description: v })} placeholder="Descreva o exercício" multiline />
          <Field label="Tipo" value={exercise.type} onChange={(v) => setExercise({ ...exercise, type: v })} placeholder="Ex.: Vídeo" />
          <Field label="URL do vídeo" type="url" value={exercise.video_url} onChange={(v) => setExercise({ ...exercise, video_url: v })} placeholder="https://..." />
          <Field label="URL da miniatura" type="url" value={exercise.thumbnail_url} onChange={(v) => setExercise({ ...exercise, thumbnail_url: v })} placeholder="https://..." />
          <SelectField label="Status" value={exercise.is_active ? "active" : "inactive"} onChange={(v) => setExercise({ ...exercise, is_active: v === "active" })} options={[[ "active", "Ativo"], ["inactive", "Inativo"]]} />
          <Actions close={() => setModal(null)} label={editingExercise ? "Salvar alterações" : "Cadastrar"} loading={saving} />
        </form>
      </Modal>}
      </AnimatePresence>
    </main>
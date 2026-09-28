import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { getDocument } from "pdfjs-dist";
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { BookOpen, ChevronLeft, ChevronRight, Dumbbell, FileText, Home, LogOut, Play, ExternalLink, RefreshCw, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { signOut } from "@/lib/auth";
import type { Tables } from "@/integrations/supabase/types";

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
    if (data.user.user_metadata?.["account_type"] !== "patient") {
      throw redirect({ to: "/painel" });
    }
    return { user: data.user };
  },
  component: PatientPage,
});

type Tab = "dashboard" | "exercicios" | "orientacoes" | "documentos";
type Exercise = Tables<"exercises">;
type PdfMaterial = Tables<"pdf_materials">;
type PatientDocument = Tables<"patient_documents">;

const nav: { id: Tab; label: string; icon: typeof Home }[] = [
  { id: "dashboard", label: "Painel", icon: Home },
  { id: "exercicios", label: "Exercícios", icon: Dumbbell },
  { id: "orientacoes", label: "Orientações", icon: BookOpen },
  { id: "documentos", label: "Documentos", icon: FileText },
];

function PatientPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("dashboard");
  const [isFirstDashboardEntry, setIsFirstDashboardEntry] = useState(true);
  const [patientName, setPatientName] = useState("Paciente");
  const [responsibleName, setResponsibleName] = useState("Responsável");
  const [patientSex, setPatientSex] = useState<"male" | "female" | "">("");
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [patientId, setPatientId] = useState<string | null>(null);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [pdfMaterials, setPdfMaterials] = useState<PdfMaterial[]>([]);
  const [pdfPreviewUrls, setPdfPreviewUrls] = useState<Record<string, string>>({});
  const [documents, setDocuments] = useState<PatientDocument[]>([]);
  const [loadingContent, setLoadingContent] = useState(true);
  const [contentError, setContentError] = useState("");
  const [openingFile, setOpeningFile] = useState<string | null>(null);
  const [viewingExercise, setViewingExercise] = useState<Exercise | null>(null);
  const [viewingPdf, setViewingPdf] = useState<PdfMaterial | null>(null);

  useEffect(() => {
    void loadPatientContent();
  }, []);

  async function loadPatientContent() {
    setLoadingContent(true);
    setContentError("");
    try {
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError || !authData.user) throw new Error("Sessão do paciente não encontrada.");

      const metadataName = authData.user.user_metadata?.["full_name"];
      if (typeof metadataName === "string" && metadataName.trim()) setPatientName(metadataName.trim());

      const { data: patientRow, error: patientError } = await supabase
        .from("patients")
        .select("id, full_name, sex, responsible_name")
        .eq("auth_user_id", authData.user.id)
        .maybeSingle();

      if (patientError) throw patientError;
      if (!patientRow) throw new Error("Paciente autenticado não encontrado.");
      setPatientId(patientRow.id);
      if (patientRow.full_name?.trim()) setPatientName(patientRow.full_name.trim());
      if (patientRow.responsible_name?.trim()) setResponsibleName(patientRow.responsible_name.trim());
      setPatientSex(patientRow.sex === "female" ? "female" : patientRow.sex === "male" ? "male" : "");

      const [
        { data: exerciseAccess, error: exerciseAccessError },
        { data: pdfAccess, error: pdfAccessError },
        { data: patientDocs, error: docsError },
      ] = await Promise.all([
        supabase.from("patient_exercise_access").select("exercise_id").eq("patient_id", patientRow.id),
        supabase.from("patient_pdf_access").select("pdf_material_id").eq("patient_id", patientRow.id),
        supabase.from("patient_documents").select("*").eq("patient_id", patientRow.id).order("created_at", { ascending: false }),
      ]);

      if (exerciseAccessError) throw exerciseAccessError;
      if (pdfAccessError) throw pdfAccessError;
      if (docsError) throw docsError;

      const exerciseIds = (exerciseAccess ?? []).map((item) => item.exercise_id);
      const pdfIds = (pdfAccess ?? []).map((item) => item.pdf_material_id);

      const [{ data: exerciseRows, error: exercisesError }, { data: pdfRows, error: pdfError }] = await Promise.all([
        exerciseIds.length
          ? supabase.from("exercises").select("*").in("id", exerciseIds).eq("is_active", true).order("created_at", { ascending: false })
          : Promise.resolve({ data: [], error: null }),
        pdfIds.length
          ? supabase.from("pdf_materials").select("*").in("id", pdfIds).order("created_at", { ascending: false })
          : Promise.resolve({ data: [], error: null }),
      ]);

      if (exercisesError) throw exercisesError;
      if (pdfError) throw pdfError;

      setExercises(exerciseRows ?? []);
      setPdfMaterials(pdfRows ?? []);
      setDocuments((patientDocs ?? []) as PatientDocument[]);

      const previewEntries = await Promise.all(
        (pdfRows ?? []).map(async (pdf) => {
          try {
            const match = pdf.storage_path?.match(/^([^/]+)\/(.+)$/);
            if (!match) return null;
            const { data, error } = await supabase.storage
              .from(match[1]!)
              .createSignedUrl(match[2]!, 60 * 10);
            if (error || !data?.signedUrl) return null;
            return [pdf.id, data.signedUrl] as const;
          } catch {
            return null;
          }
        }),
      );

      setPdfPreviewUrls(
        Object.fromEntries(previewEntries.filter((entry): entry is readonly [string, string] => Boolean(entry))),
      );
    } catch (err) {
      console.error("Erro ao carregar conteúdos do paciente:", err);
      setContentError(err instanceof Error ? err.message : "Não foi possível carregar seus conteúdos.");
    } finally {
      setLoadingContent(false);
    }
  }

  async function openStorageFile(storagePath: string, id: string, bucket?: string) {
    if (!storagePath || openingFile) return;
    setOpeningFile(id);
    try {
      let storageBucket = bucket;
      let storageObjectPath = storagePath;

      if (!storageBucket) {
        const match = storagePath.match(/^([^/]+)\/(.+)$/);
        if (!match) throw new Error("Arquivo inválido.");
        storageBucket = match[1]!;
        storageObjectPath = match[2]!;
      }

      const { data, error } = await supabase.storage.from(storageBucket).createSignedUrl(storageObjectPath, 60 * 10);
      if (error) throw error;
      window.open(data.signedUrl, "_blank", "noopener,noreferrer");
    } catch (err) {
      console.error("Erro ao abrir arquivo:", err);
      setContentError("Não foi possível abrir este arquivo.");
    } finally {
      setOpeningFile(null);
    }
  }

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

        <div className="min-w-0 flex-1 overflow-x-hidden overflow-y-hidden pb-24 lg:pb-0">
          <header className={`sticky top-0 z-20 border-b border-[#eee5d9]/90 px-4 py-3 backdrop-blur-xl sm:px-6 lg:hidden ${tab === "dashboard" ? "bg-white" : "bg-[#faf8f4]/95"}`}>
            <div className="flex items-center justify-center lg:hidden">
              <img src={logo} alt="Erick Paulino Fisioterapia" className="h-auto w-[min(52vw,210px)] object-contain" />
              <button type="button" onClick={() => setConfirmLogout(true)} className="absolute right-4 top-1/2 flex -translate-y-1/2 items-center gap-2 rounded-xl bg-[#c94b4b] px-3 py-2 text-xs font-semibold text-white shadow-[0_6px_18px_rgba(201,75,75,0.20)] transition hover:bg-[#b83d3d]">
                <LogOut className="size-4" /> Sair
              </button>
            </div>
          </header>

          <div className="mx-auto h-full w-full max-w-[1400px] min-w-0 overflow-x-hidden overflow-y-auto px-4 py-6 sm:px-6 sm:py-8 lg:px-10 lg:py-14">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={tab}
                className="premium-tab-content"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.36, ease: "easeOut" }}
              >
                {tab === "dashboard" && (
                  <Dashboard name={patientName} responsibleName={responsibleName} patientSex={patientSex} animateFirstEntry={isFirstDashboardEntry} exerciseCount={exercises.length} documentCount={documents.length} onTab={setTab} />
                )}
                {tab === "exercicios" && <ExercisesTab exercises={exercises} patientName={patientName} patientSex={patientSex} loading={loadingContent} error={contentError} onRetry={() => void loadPatientContent()} onView={setViewingExercise} />}
                {tab === "orientacoes" && <OrientacoesTab pdfMaterials={pdfMaterials} patientName={patientName} patientSex={patientSex} previewUrls={pdfPreviewUrls} loading={loadingContent} error={contentError} onRetry={() => void loadPatientContent()} onView={setViewingPdf} />}
                {tab === "documentos" && <DocumentsTab documents={documents} loading={loadingContent} error={contentError} openingFile={openingFile} onOpenDocument={(document) => void openStorageFile(document.storage_path, document.id, "patient-documents")} onRetry={() => void loadPatientContent()} />}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>

      <nav className="fixed inset-x-3 bottom-3 z-30 grid grid-cols-4 items-stretch gap-1 rounded-2xl border border-[#dfd0bb] bg-white/95 px-2 py-2 shadow-[0_14px_40px_rgba(64,48,30,0.16)] backdrop-blur-xl lg:hidden">
        {nav.map(({ id, label, icon: Icon }) => (
          <button key={id} type="button" onClick={() => setTab(id)} data-active={tab === id ? "true" : "false"} className={`premium-tab-button flex min-w-0 flex-col items-center justify-center gap-1 rounded-xl px-1 py-2 text-[9px] font-medium transition ${tab === id ? "bg-[#BA9051]/10 text-[#A97A3C]" : "text-[#8e857c] hover:bg-[#faf7f2]"}`}>
            <Icon className="size-[18px]" strokeWidth={1.8} /><span className="truncate">{label}</span>
          </button>
        ))}
      </nav>

      <AnimatePresence mode="wait">
        {viewingExercise && <PatientExerciseVideoModal exercise={viewingExercise} close={() => setViewingExercise(null)} />}
        {viewingPdf && <PatientPdfModal pdf={viewingPdf} previewUrl={pdfPreviewUrls[viewingPdf.id] ?? null} close={() => setViewingPdf(null)} />}
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

function Dashboard({ name, responsibleName, patientSex, animateFirstEntry, exerciseCount, documentCount, onTab }: { name: string; responsibleName: string; patientSex: "male" | "female" | ""; animateFirstEntry: boolean; exerciseCount: number; documentCount: number; onTab: (tab: Tab) => void }) {
  const article = patientSex === "female" ? "a" : "o";
  return (
    <div className="space-y-8">
      <section className="p-0">
        <p className="text-xs font-medium uppercase tracking-[0.16em] text-[#BA9051]">Painel</p>
        <h1 className="mt-2 text-xl font-semibold text-[#2D2823] sm:text-2xl">Olá, {responsibleName.split(" ")[0]}! 👋<br />Como está {article} {name.split(" ")[0]} hoje? 💛</h1>
        <p className="mt-2 text-sm text-[#746C64]">Estou aqui para acompanhar vocês em cada etapa!</p>
      </section>

      <section className="overflow-hidden rounded-[1.5rem] border border-[#E6D8C5] bg-white shadow-[0_10px_30px_rgba(64,48,30,0.06)]">
        <div className="border-b border-[#eee5d9] px-5 py-4 sm:px-6">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#BA9051]">Boas Vindas</p>
        </div>
        <div className="bg-[#171412]">
          <div className="flex aspect-video items-center justify-center bg-[radial-gradient(circle_at_center,#3a3128_0%,#171412_72%)] p-6">
            <div className="text-center">
              <span className="mx-auto flex size-16 items-center justify-center rounded-full bg-white/95 text-[#BA9051] shadow-[0_10px_30px_rgba(0,0,0,0.24)]">
                <Play className="ml-1 size-7 fill-current" />
              </span>
              <p className="mt-4 text-sm font-semibold text-white">Boas Vindas</p>
            </div>
          </div>
        </div>
      </section>


    </div>
  );
}

function getVideoEmbedUrl(url: string | null) {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, "").toLowerCase();
    if (host === "youtu.be") { const id = parsed.pathname.slice(1).split("/")[0]; return id ? "https://www.youtube.com/embed/" + id + "?rel=0" : null; }
    if (host === "youtube.com" || host === "m.youtube.com") { const id = parsed.searchParams.get("v") || parsed.pathname.match(/\/(?:shorts|embed)\/([^/?]+)/)?.[1]; return id ? "https://www.youtube.com/embed/" + id + "?rel=0" : null; }
    if (host === "vimeo.com" || host === "player.vimeo.com") { const id = parsed.pathname.match(/\/(?:video\/)?(\d+)/)?.[1]; return id ? "https://player.vimeo.com/video/" + id : null; }
    return url;
  } catch { return null; }
}

function PatientExerciseVideoModal({ exercise, close }: { exercise: Exercise; close: () => void }) {
  const embedUrl = getVideoEmbedUrl(exercise.video_url);
  return <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.28, ease: "easeOut" }} className="premium-modal-backdrop fixed inset-0 z-[70] flex items-center justify-center overflow-hidden bg-[#2D2823]/55 p-3 backdrop-blur-sm sm:p-5" onClick={(e) => e.target === e.currentTarget && close()}>
    <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.97 }} transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }} className="premium-modal-panel max-h-[calc(100dvh-1.5rem)] w-full max-w-4xl overflow-y-auto overscroll-contain rounded-[1.5rem] border border-[#e3d3bd] bg-white shadow-[0_30px_100px_rgba(45,40,35,0.32)] sm:max-h-[calc(100dvh-2.5rem)]">
      <div className="flex items-center justify-between gap-4 border-b border-[#eee5d9] px-4 py-3 sm:px-5 sm:py-4"><div className="min-w-0"><p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-[#A97A3C]">{exercise.type || "Vídeo"}</p><h2 className="mt-0.5 truncate text-base font-semibold text-[#302b26] sm:text-lg">{exercise.name}</h2></div><button type="button" onClick={close} className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-[#e2cfb4] bg-[#fffdf9] text-[#746c64] transition hover:border-[#BA9051] hover:bg-[#f8f0e5] hover:text-[#A97A3C]" aria-label="Fechar vídeo"><X className="size-5" /></button></div>
      <div className="bg-[#171412]">{embedUrl ? <div className="aspect-video w-full"><iframe src={embedUrl} title={exercise.name} className="size-full border-0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen /></div> : <div className="flex aspect-video items-center justify-center p-6 text-center text-sm text-white/70">Este exercício ainda não possui um link de vídeo válido.</div>}</div>
      <div className="px-5 py-4 sm:px-6 sm:py-5"><p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#A97A3C]">Orientações</p><p className="mt-2 text-sm leading-relaxed text-[#746c64]">{exercise.description || "Nenhuma orientação cadastrada para este exercício."}</p></div>
    </motion.div>
  </motion.div>;
}
function ContentState({ loading, error, onRetry }: { loading: boolean; error: string; onRetry: () => void }) {
  if (loading) return <div className="flex min-h-[280px] items-center justify-center text-sm text-[#837970]"><RefreshCw className="mr-2 size-4 animate-spin text-[#BA9051]" />Carregando conteúdos...</div>;
  if (error) return <div className="rounded-2xl border border-[#efcaca] bg-[#fff7f7] p-6 text-center"><p className="text-sm font-medium text-[#c94b4b]">Não foi possível carregar os conteúdos.</p><p className="mt-1 text-xs text-[#8a8178]">{error}</p><button type="button" onClick={onRetry} className="mt-4 rounded-xl bg-[#BA9051] px-4 py-2 text-xs font-semibold text-white hover:bg-[#A97A3C]">Tentar novamente</button></div>;
  return null;
}

function ExercisesTab({ exercises, patientName, patientSex, loading, error, onRetry, onView }: { exercises: Exercise[]; patientName: string; patientSex: "male" | "female" | ""; loading: boolean; error: string; onRetry: () => void; onView: (exercise: Exercise) => void }) {
  const article = patientSex === "female" ? "a" : "o";
  const personalizedSubtitle = `Exercícios recomendados para ${article} ${patientName.split(" ")[0]}.`;
  const carouselRef = useRef<HTMLDivElement>(null);

  function scrollCarousel(direction: "previous" | "next") {
    const container = carouselRef.current;
    if (!container) return;

    const card = container.querySelector<HTMLElement>("[data-exercise-card]");
    const distance = card ? card.offsetWidth + 20 : container.clientWidth * 0.88;
    container.scrollBy({ left: direction === "next" ? distance : -distance, behavior: "smooth" });
  }

  if (loading || error) return <section className="space-y-5"><SectionHeader icon={Dumbbell} title="Exercícios" subtitle={personalizedSubtitle} /><ContentState loading={loading} error={error} onRetry={onRetry} /></section>;
  return <section className="space-y-5">
    <SectionHeader icon={Dumbbell} title="Exercícios" subtitle={personalizedSubtitle} />
    {exercises.length === 0 ? <EmptyContent icon={Dumbbell} title="Nenhum exercício disponível" text="Seu fisioterapeuta ainda não liberou exercícios para sua conta." /> :
      <div className="relative -mx-1 overflow-hidden sm:mx-0 sm:overflow-visible">
        <div className="relative rounded-[1.35rem] border border-[#e6d9c9] bg-white p-2 shadow-[0_10px_30px_rgba(64,48,30,0.045)] sm:p-3">
          <button type="button" onClick={() => scrollCarousel("previous")} aria-label="Exercícios anteriores" className="absolute left-2 top-1/2 z-10 flex size-9 -translate-y-1/2 items-center justify-center rounded-full border border-[#dfd2c1] bg-white/95 text-[#746c64] shadow-[0_8px_22px_rgba(64,48,30,0.14)] backdrop-blur-sm transition hover:border-[#BA9051] hover:bg-[#fffaf2] hover:text-[#A97A3C] disabled:cursor-not-allowed disabled:opacity-30 sm:size-10 sm:left-3 lg:left-2">
            <ChevronLeft className="size-5" />
          </button>
          <button type="button" onClick={() => scrollCarousel("next")} aria-label="Próximos exercícios" className="absolute right-2 top-1/2 z-10 flex size-9 -translate-y-1/2 items-center justify-center rounded-full border border-[#dfd2c1] bg-white/95 text-[#746c64] shadow-[0_8px_22px_rgba(64,48,30,0.14)] backdrop-blur-sm transition hover:border-[#BA9051] hover:bg-[#fffaf2] hover:text-[#A97A3C] disabled:cursor-not-allowed disabled:opacity-30 sm:size-10 sm:right-3 lg:right-2">
            <ChevronRight className="size-5" />
          </button>

          <div ref={carouselRef} className="flex gap-4 overflow-x-auto px-1 pb-3 snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:grid sm:grid-cols-2 sm:gap-5 sm:overflow-y-visible sm:overflow-x-hidden sm:px-1 sm:pb-1 sm:snap-none xl:grid-cols-3">
            {exercises.map((exercise) => (
              <article key={exercise.id} data-exercise-card className="w-[calc(100vw-3.5rem)] max-w-[420px] shrink-0 snap-start overflow-hidden rounded-[1.35rem] border border-[#E6D8C5] bg-white shadow-[0_10px_30px_rgba(64,48,30,0.06)] sm:w-auto">
                <div className="relative aspect-video bg-[#f4eee6]">
                  {exercise.thumbnail_url ? <img src={exercise.thumbnail_url} alt={exercise.name} className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-[#BA9051]"><Dumbbell className="size-10" strokeWidth={1.4} /></div>}
                  <button type="button" onClick={() => onView(exercise)} aria-label={`Reproduzir ${exercise.name}`} className="absolute left-1/2 top-1/2 flex size-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 text-[#BA9051] shadow-[0_10px_30px_rgba(45,40,35,0.22)] transition hover:scale-105 hover:bg-white sm:size-16"><Play className="ml-0.5 size-7 fill-current sm:size-8" /></button>
                  <span className="absolute bottom-3 left-3 flex items-center gap-1.5 rounded-full bg-white/95 px-2.5 py-1 text-[10px] font-semibold text-[#A97A3C] shadow"><Play className="size-3" />Vídeo</span>
                </div>
                <div className="p-5"><h2 className="truncate text-base font-semibold text-[#2D2823]">{exercise.name}</h2>{exercise.description && <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-[#746C64]">{exercise.description}</p>}
                  {exercise.video_url && (
                    <button type="button" onClick={() => onView(exercise)} className="mt-4 inline-flex h-10 items-center gap-2 rounded-xl bg-[#BA9051] px-4 text-xs font-semibold text-white transition hover:bg-[#A97A3C]">
                      <Play className="size-3.5 fill-current" />
                      Assistir exercício
                    </button>
                  )}
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    }
  </section>;
}
function OrientacoesTab({ pdfMaterials, patientName, patientSex, previewUrls, loading, error, onRetry, onView }: { pdfMaterials: PdfMaterial[]; patientName: string; patientSex: "male" | "female" | ""; previewUrls: Record<string, string>; loading: boolean; error: string; onRetry: () => void; onView: (pdf: PdfMaterial) => void }) {
  const article = patientSex === "female" ? "a" : "o";
  const personalizedSubtitle = `Orientações recomendadas para ${article} ${patientName.split(" ")[0]}.`;
  if (loading || error) return <section className="space-y-5"><SectionHeader icon={BookOpen} title="Orientações" subtitle={personalizedSubtitle} /><ContentState loading={loading} error={error} onRetry={onRetry} /></section>;
  return <section className="space-y-6">
    <SectionHeader icon={BookOpen} title="Orientações" subtitle={personalizedSubtitle} />
    {pdfMaterials.length === 0 ? (
      <div className="rounded-2xl border border-dashed border-[#dfd2c1] bg-white p-6 text-center text-xs text-[#948a81]">Nenhuma orientação em PDF foi liberada para você.</div>
    ) : (
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {pdfMaterials.map((pdf) => (
          <article key={pdf.id} className="flex min-h-[180px] min-w-0 flex-col justify-between rounded-[1.35rem] border border-[#E6D8C5] bg-white p-5 shadow-[0_10px_30px_rgba(64,48,30,0.06)] transition hover:border-[#d7bd94] hover:shadow-[0_16px_38px_rgba(64,48,30,0.10)] sm:p-6">
            <div>
              <div className="flex items-start justify-between gap-4">
                <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-[#BA9051]/10 text-[#A97A3C]"><FileText className="size-6" /></span>
                
              </div>
              <h3 className="mt-5 line-clamp-2 text-base font-semibold leading-snug text-[#2D2823]">{pdf.name}</h3>
              <p className="mt-2 text-xs leading-relaxed text-[#746C64]">Material de orientação preparado pelo seu fisioterapeuta para acompanhamento em casa.</p>
            </div>
            <button type="button" onClick={() => onView(pdf)} disabled={!previewUrls[pdf.id]} className="mt-6 flex h-11 w-full shrink-0 items-center justify-center gap-2 rounded-xl bg-[#BA9051] px-4 text-xs font-semibold text-white shadow-[0_6px_18px_rgba(186,144,81,0.20)] transition hover:bg-[#A97A3C] disabled:cursor-not-allowed disabled:opacity-45">
              <ExternalLink className="size-4" />Visualizar orientação
            </button>
          </article>
        ))}
      </div>
    )}
  </section>;
}

function PatientPdfModal({ pdf, previewUrl, close }: { pdf: PdfMaterial; previewUrl: string | null; close: () => void }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.28, ease: "easeOut" }} className="premium-modal-backdrop fixed inset-0 z-[75] flex items-center justify-center bg-[#2D2823]/60 p-2 backdrop-blur-sm sm:p-4" onClick={(e) => e.target === e.currentTarget && close()}>
      <motion.div initial={{ opacity: 0, scale: 0.98, y: 8 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.98, y: 8 }} transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }} className="relative flex h-[calc(100dvh-1rem)] w-full max-w-6xl flex-col overflow-hidden rounded-[1.25rem] border border-[#e3d3bd] bg-white shadow-[0_30px_100px_rgba(45,40,35,0.34)] sm:h-[calc(100dvh-2rem)] sm:rounded-[1.5rem]">
        <div className="flex h-14 shrink-0 items-center justify-between gap-3 border-b border-[#eee5d9] bg-white px-3 sm:h-16 sm:px-5">
          <h2 className="min-w-0 truncate text-sm font-semibold text-[#2D2823] sm:text-base">{pdf.name}</h2>
          <button type="button" onClick={close} className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-[#e2cfb4] bg-[#fffdf9] text-[#746c64] transition hover:border-[#BA9051] hover:bg-[#f8f0e5] hover:text-[#A97A3C]" aria-label="Fechar documento" title="Fechar"><X className="size-5" /></button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto bg-[#f1eee9] p-2 sm:p-4">
          {previewUrl ? <PdfDocumentViewer url={previewUrl} title={pdf.name} /> : <div className="flex min-h-[320px] items-center justify-center p-6 text-center text-sm text-[#948a81]">Não foi possível carregar este documento.</div>}
        </div>
      </motion.div>
    </motion.div>
  );
}

function PdfDocumentViewer({ url, title }: { url: string; title: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    let cancelled = false;
    let pdfDocument: Awaited<ReturnType<typeof getDocument>["promise"]> | null = null;

    async function renderPdf() {
      try {
        setState("loading");
        const response = await fetch(url, { method: "GET", cache: "no-store" });
        if (!response.ok) throw new Error(`Falha ao baixar o PDF: ${response.status}`);
        const buffer = await response.arrayBuffer();
        if (cancelled) return;

        const loadingTask = getDocument({
          data: new Uint8Array(buffer),
          disableAutoFetch: true,
          disableStream: true,
        });
        pdfDocument = await loadingTask.promise;
        if (cancelled) {
          await pdfDocument.destroy();
          return;
        }

        const container = containerRef.current;
        if (!container) throw new Error("Visualizador não encontrado.");
        container.replaceChildren();

        for (let pageNumber = 1; pageNumber <= pdfDocument.numPages; pageNumber += 1) {
          if (cancelled) break;
          const page = await pdfDocument.getPage(pageNumber);
          const baseViewport = page.getViewport({ scale: 1 });
          const availableWidth = Math.max(container.clientWidth - 8, 280);
          const viewport = page.getViewport({ scale: availableWidth / baseViewport.width });
          const canvas = document.createElement("canvas");
          const context = canvas.getContext("2d");
          if (!context) throw new Error("Não foi possível preparar o documento.");

          const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
          canvas.width = Math.ceil(viewport.width * pixelRatio);
          canvas.height = Math.ceil(viewport.height * pixelRatio);
          canvas.style.width = "100%";
          canvas.style.height = "auto";
          canvas.className = "block rounded-xl bg-white shadow-[0_6px_20px_rgba(64,48,30,0.08)]";
          context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
          container.appendChild(canvas);

          await page.render({ canvasContext: context, viewport }).promise;
        }

        if (!cancelled) setState("ready");
      } catch (error) {
        console.error("Erro ao renderizar PDF:", error);
        if (!cancelled) setState("error");
      } finally {
        if (pdfDocument && cancelled) await pdfDocument.destroy().catch(() => undefined);
      }
    }

    void renderPdf();

    return () => {
      cancelled = true;
      if (pdfDocument) void pdfDocument.destroy();
    };
  }, [url]);

  return (
    <div className="relative min-h-full">
      {state === "loading" && <div className="flex min-h-[320px] items-center justify-center text-sm text-[#837970]"><RefreshCw className="mr-2 size-4 animate-spin text-[#BA9051]" />Carregando orientação...</div>}
      {state === "error" && <div className="flex min-h-[320px] flex-col items-center justify-center p-6 text-center"><FileText className="size-10 text-[#BA9051]" /><p className="mt-3 text-sm font-semibold text-[#2D2823]">Não foi possível visualizar esta orientação.</p><p className="mt-1 max-w-md text-xs leading-relaxed text-[#948a81]">O documento não pôde ser renderizado neste momento.</p></div>}
      <div ref={containerRef} className={state === "error" ? "hidden" : "space-y-3"} aria-label={title} />
    </div>
  );
}
function DocumentsTab({ documents, loading, error, openingFile, onOpenDocument, onRetry }: { documents: PatientDocument[]; loading: boolean; error: string; openingFile: string | null; onOpenDocument: (document: PatientDocument) => void; onRetry: () => void }) {
  if (loading || error) return <section className="space-y-5"><SectionHeader icon={FileText} title="Documentos" subtitle="Relatórios e Documentos solicitados " /><ContentState loading={loading} error={error} onRetry={onRetry} /></section>;
  return <section className="space-y-6">
    <SectionHeader icon={FileText} title="Documentos" subtitle="Relatórios e documentos disponibilizados pelo seu fisioterapeuta." />
    <DocumentGroup title="" items={documents.map((document) => ({ id: document.id, name: document.file_name, meta: formatFileSize(document.file_size), onOpen: () => onOpenDocument(document), opening: openingFile === document.id }))} empty="Nenhum relatório ou documento foi anexado para você." icon={FileText} />
  </section>;
}

function SectionHeader({ icon: Icon, title, subtitle }: { icon: typeof Home; title: string; subtitle: string }) {
  return <div className="flex min-w-0 items-start gap-4"><span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-[#BA9051]/10 text-[#A97A3C]"><Icon className="size-6" strokeWidth={1.8} /></span><div className="min-w-0 flex-1"><h1 className="mt-1 text-lg font-semibold text-[#2D2823] sm:text-2xl">{title}</h1><p className="mt-1 text-xs text-[#746C64] sm:text-sm">{subtitle}</p></div></div>;
}

function DocumentGroup({ title, items, empty, icon: Icon }: { title: string; items: { id: string; name: string; meta: string; onOpen: () => void; opening: boolean }[]; empty: string; icon: typeof FileText }) {
  return <div className="space-y-3">{title && <h2 className="text-sm font-semibold text-[#A97A3C]">{title}</h2>}{items.length === 0 ? <div className="rounded-2xl border border-dashed border-[#dfd2c1] bg-white p-6 text-center text-xs text-[#948a81]">{empty}</div> : <div className="grid w-full min-w-0 gap-3 sm:grid-cols-2 xl:grid-cols-3">{items.map((item) => <article key={item.id} className="flex min-w-0 w-full items-center gap-3 rounded-2xl border border-[#E6D8C5] bg-white p-4 shadow-[0_8px_24px_rgba(64,48,30,0.05)]"><span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#f3e3cf] text-[#A97A3C]"><Icon className="size-5" /></span><div className="min-w-0 flex-1"><h3 className="truncate text-xs font-semibold text-[#2D2823]">{item.name}</h3><p className="mt-1 truncate text-[10px] text-[#948a81]">{item.meta}</p></div><button type="button" onClick={item.onOpen} disabled={item.opening} className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-[#dfc28f] bg-[#fffaf2] text-[#A97A3C] transition hover:bg-[#f7eddf] disabled:opacity-50" aria-label={`Abrir ${item.name}`} title={`Abrir ${item.name}`}>{item.opening ? <RefreshCw className="size-4 animate-spin" /> : <ExternalLink className="size-4" />}</button></article>)}</div>}</div>;
}

function EmptyContent({ icon: Icon, title, text }: { icon: typeof Home; title: string; text: string }) {
  return <div className="rounded-[1.35rem] border border-dashed border-[#dfd2c1] bg-white p-10 text-center shadow-[0_8px_24px_rgba(64,48,30,0.04)]"><span className="mx-auto flex size-12 items-center justify-center rounded-xl bg-[#BA9051]/10 text-[#A97A3C]"><Icon className="size-6" /></span><h2 className="mt-4 text-sm font-semibold text-[#403a35]">{title}</h2><p className="mx-auto mt-1 max-w-md text-xs leading-relaxed text-[#948a81]">{text}</p></div>;
}

function formatFileSize(size: number | null) {
  if (!size) return "Tamanho não informado";
  if (size < 1024) return size + " B";
  if (size < 1024 * 1024) return (size / 1024).toFixed(1) + " KB";
  return (size / (1024 * 1024)).toFixed(1) + " MB";
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

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { Dumbbell, FileText, Home, LogOut, Play, ExternalLink, RefreshCw, X } from "lucide-react";
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
    if (data.user.user_metadata?.account_type !== "patient") {
      throw redirect({ to: "/painel" });
    }
    return { user: data.user };
  },
  component: PatientPage,
});

type Tab = "dashboard" | "exercicios" | "documentos";
type Exercise = Tables<"exercises">;
type PdfMaterial = Tables<"pdf_materials">;
type PatientDocument = Tables<"patient_documents">;

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
  const [patientId, setPatientId] = useState<string | null>(null);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [pdfMaterials, setPdfMaterials] = useState<PdfMaterial[]>([]);
  const [documents, setDocuments] = useState<PatientDocument[]>([]);
  const [loadingContent, setLoadingContent] = useState(true);
  const [contentError, setContentError] = useState("");
  const [openingFile, setOpeningFile] = useState<string | null>(null);
  const [viewingExercise, setViewingExercise] = useState<Exercise | null>(null);

  useEffect(() => {
    void loadPatientContent();
  }, []);

  async function loadPatientContent() {
    setLoadingContent(true);
    setContentError("");
    try {
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError || !authData.user) throw new Error("Sessão do paciente não encontrada.");

      const metadataName = authData.user.user_metadata?.full_name;
      if (typeof metadataName === "string" && metadataName.trim()) setPatientName(metadataName.trim());

      const { data: patientRow, error: patientError } = await supabase
        .from("patients")
        .select("id, full_name")
        .eq("auth_user_id", authData.user.id)
        .maybeSingle();

      if (patientError) throw patientError;
      if (!patientRow) throw new Error("Paciente autenticado não encontrado.");
      setPatientId(patientRow.id);
      if (patientRow.full_name?.trim()) setPatientName(patientRow.full_name.trim());

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
    } catch (err) {
      console.error("Erro ao carregar conteúdos do paciente:", err);
      setContentError(err instanceof Error ? err.message : "Não foi possível carregar seus conteúdos.");
    } finally {
      setLoadingContent(false);
    }
  }

  async function openStorageFile(storagePath: string, id: string) {
    if (!storagePath || openingFile) return;
    setOpeningFile(id);
    try {
      const match = storagePath.match(/^([^/]+)\/(.+)$/);
      if (!match) throw new Error("Arquivo inválido.");
      const [, bucket, path] = match;
      const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, 60 * 10);
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
                  <Dashboard name={patientName} animateFirstEntry={isFirstDashboardEntry} exerciseCount={exercises.length} documentCount={pdfMaterials.length + documents.length} onTab={setTab} />
                )}
                {tab === "exercicios" && <ExercisesTab exercises={exercises} loading={loadingContent} error={contentError} onRetry={() => void loadPatientContent()} onView={setViewingExercise} />}
                {tab === "documentos" && <DocumentsTab pdfMaterials={pdfMaterials} documents={documents} loading={loadingContent} error={contentError} openingFile={openingFile} onOpenPdf={(pdf) => void openStorageFile(pdf.storage_path, pdf.id)} onOpenDocument={(document) => void openStorageFile(document.storage_path, document.id)} onRetry={() => void loadPatientContent()} />}
              </motion.div>
            </AnimatePresence>
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
        {viewingExercise && <PatientExerciseVideoModal exercise={viewingExercise} close={() => setViewingExercise(null)} />}
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

function Dashboard({ name, animateFirstEntry, exerciseCount, documentCount, onTab }: { name: string; animateFirstEntry: boolean; exerciseCount: number; documentCount: number; onTab: (tab: Tab) => void }) {
  return (
    <div className="space-y-8">
      <section className="rounded-[1.5rem] border border-[#E6D8C5] bg-white p-6 shadow-[0_10px_30px_rgba(64,48,30,0.06)] sm:p-8">
        <p className="text-xs font-medium uppercase tracking-[0.16em] text-[#BA9051]">Painel</p>
        <h1 className="mt-2 text-2xl font-semibold text-[#2D2823] sm:text-3xl">Olá, {name.split(" ")[0]}!</h1>
        <p className="mt-2 text-sm text-[#746C64]">Acompanhe aqui os conteúdos disponibilizados pelo seu fisioterapeuta.</p>
      </section>

      <div className="grid gap-5 md:grid-cols-2">
        <button type="button" onClick={() => onTab("exercicios")} className="rounded-[1.5rem] border border-[#E6D8C5] bg-white p-6 text-left shadow-[0_10px_30px_rgba(64,48,30,0.06)] transition hover:-translate-y-0.5 hover:shadow-[0_16px_35px_rgba(64,48,30,0.10)]">
          <Dumbbell className="size-6 text-[#BA9051]" strokeWidth={1.8} />
          <h2 className="mt-4 text-lg font-semibold">Exercícios</h2>
          <p className="mt-1 text-sm text-[#746C64]">{exerciseCount} {exerciseCount === 1 ? "exercício disponível" : "exercícios disponíveis"}.</p>
        </button>
        <button type="button" onClick={() => onTab("documentos")} className="rounded-[1.5rem] border border-[#E6D8C5] bg-white p-6 text-left shadow-[0_10px_30px_rgba(64,48,30,0.06)] transition hover:-translate-y-0.5 hover:shadow-[0_16px_35px_rgba(64,48,30,0.10)]">
          <FileText className="size-6 text-[#BA9051]" strokeWidth={1.8} />
          <h2 className="mt-4 text-lg font-semibold">Documentos</h2>
          <p className="mt-1 text-sm text-[#746C64]">{documentCount} {documentCount === 1 ? "documento disponível" : "documentos disponíveis"}.</p>
        </button>
      </div>
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

function ExercisesTab({ exercises, loading, error, onRetry, onView }: { exercises: Exercise[]; loading: boolean; error: string; onRetry: () => void; onView: (exercise: Exercise) => void }) {
  if (loading || error) return <section className="space-y-5"><SectionHeader icon={Dumbbell} title="Exercícios" subtitle="Exercícios disponibilizados pelo seu fisioterapeuta." /><ContentState loading={loading} error={error} onRetry={onRetry} /></section>;
  return <section className="space-y-5">
    <SectionHeader icon={Dumbbell} title="Exercícios" subtitle="Exercícios disponibilizados pelo seu fisioterapeuta." />
    {exercises.length === 0 ? <EmptyContent icon={Dumbbell} title="Nenhum exercício disponível" text="Seu fisioterapeuta ainda não liberou exercícios para sua conta." /> :
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">{exercises.map((exercise) => (
        <article key={exercise.id} className="overflow-hidden rounded-[1.35rem] border border-[#E6D8C5] bg-white shadow-[0_10px_30px_rgba(64,48,30,0.06)]">
          <div className="relative aspect-video bg-[#f4eee6]">
            {exercise.thumbnail_url ? <img src={exercise.thumbnail_url} alt={exercise.name} className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-[#BA9051]"><Dumbbell className="size-10" strokeWidth={1.4} /></div>}
            <span className="absolute bottom-3 left-3 flex items-center gap-1.5 rounded-full bg-white/95 px-2.5 py-1 text-[10px] font-semibold text-[#A97A3C] shadow"><Play className="size-3" />Vídeo</span>
          </div>
          <div className="p-5"><h2 className="truncate text-base font-semibold text-[#2D2823]">{exercise.name}</h2>{exercise.description && <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-[#746C64]">{exercise.description}</p>}
            {exercise.video_url ? <button type="button" onClick={() => onView(exercise)} className="mt-4 inline-flex h-10 items-center gap-2 rounded-xl bg-[#BA9051] px-4 text-xs font-semibold text-white transition hover:bg-[#A97A3C]"><Play className="size-4" />Assistir exercício</button> : <p className="mt-4 text-[11px] text-[#a79d94]">Vídeo indisponível.</p>}
          </div>
        </article>
      ))}</div>}
  </section>;
}

function DocumentsTab({ pdfMaterials, documents, loading, error, openingFile, onOpenPdf, onOpenDocument, onRetry }: { pdfMaterials: PdfMaterial[]; documents: PatientDocument[]; loading: boolean; error: string; openingFile: string | null; onOpenPdf: (pdf: PdfMaterial) => void; onOpenDocument: (document: PatientDocument) => void; onRetry: () => void }) {
  if (loading || error) return <section className="space-y-5"><SectionHeader icon={FileText} title="Documentos" subtitle="Materiais e documentos disponibilizados pelo seu fisioterapeuta." /><ContentState loading={loading} error={error} onRetry={onRetry} /></section>;
  return <section className="space-y-6">
    <SectionHeader icon={FileText} title="Documentos" subtitle="Materiais e documentos disponibilizados pelo seu fisioterapeuta." />
    <DocumentGroup title="Materiais em PDF" items={pdfMaterials.map((pdf) => ({ id: pdf.id, name: pdf.name, meta: pdf.file_name, onOpen: () => onOpenPdf(pdf), opening: openingFile === pdf.id }))} empty="Nenhum PDF foi liberado para você." icon={FileText} />
    <DocumentGroup title="Relatórios e documentos" items={documents.map((document) => ({ id: document.id, name: document.file_name, meta: formatFileSize(document.file_size), onOpen: () => onOpenDocument(document), opening: openingFile === document.id }))} empty="Nenhum relatório ou documento foi anexado para você." icon={FileText} />
  </section>;
}

function SectionHeader({ icon: Icon, title, subtitle }: { icon: typeof Home; title: string; subtitle: string }) {
  return <div className="flex items-start gap-4"><span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-[#BA9051]/10 text-[#A97A3C]"><Icon className="size-6" strokeWidth={1.8} /></span><div><p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#BA9051]">Área do paciente</p><h1 className="mt-1 text-xl font-semibold text-[#2D2823] sm:text-2xl">{title}</h1><p className="mt-1 text-sm text-[#746C64]">{subtitle}</p></div></div>;
}

function DocumentGroup({ title, items, empty, icon: Icon }: { title: string; items: { id: string; name: string; meta: string; onOpen: () => void; opening: boolean }[]; empty: string; icon: typeof FileText }) {
  return <div className="space-y-3"><h2 className="text-sm font-semibold text-[#A97A3C]">{title}</h2>{items.length === 0 ? <div className="rounded-2xl border border-dashed border-[#dfd2c1] bg-white p-6 text-center text-xs text-[#948a81]">{empty}</div> : <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{items.map((item) => <article key={item.id} className="flex items-center gap-3 rounded-2xl border border-[#E6D8C5] bg-white p-4 shadow-[0_8px_24px_rgba(64,48,30,0.05)]"><span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#f3e3cf] text-[#A97A3C]"><Icon className="size-5" /></span><div className="min-w-0 flex-1"><h3 className="truncate text-xs font-semibold text-[#2D2823]">{item.name}</h3><p className="mt-1 truncate text-[10px] text-[#948a81]">{item.meta}</p></div><button type="button" onClick={item.onOpen} disabled={item.opening} className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-[#dfc28f] bg-[#fffaf2] text-[#A97A3C] transition hover:bg-[#f7eddf] disabled:opacity-50" aria-label={`Abrir ${item.name}`} title={`Abrir ${item.name}`}>{item.opening ? <RefreshCw className="size-4 animate-spin" /> : <ExternalLink className="size-4" />}</button></article>)}</div>}</div>;
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

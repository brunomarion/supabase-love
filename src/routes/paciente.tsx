import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { FileText, LogOut, Play, RefreshCw, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { signOut } from "@/lib/auth";
import type { Tables } from "@/integrations/supabase/types";

type Patient = Tables<"patients">;
type Exercise = Tables<"exercises">;
type PdfMaterial = Tables<"pdf_materials">;
type PatientDocument = Tables<"patient_documents">;

export const Route = createFileRoute("/paciente")({ ssr: false, component: PatientPortal });

function PatientPortal() {
  const navigate = useNavigate();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [pdfs, setPdfs] = useState<PdfMaterial[]>([]);
  const [documents, setDocuments] = useState<PatientDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [opening, setOpening] = useState<string | null>(null);

  useEffect(() => { void load(); }, []);

  async function load() {
    try {
      setLoading(true);
      setError("");
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) { navigate({ to: "/", replace: true }); return; }

      const { data: row, error: patientError } = await supabase.from("patients").select("*").eq("auth_user_id", user.id).maybeSingle();
      if (patientError) throw patientError;
      if (!row || row.status !== "active") { await signOut(); navigate({ to: "/", replace: true }); return; }
      setPatient(row);

      const { data: exerciseLinks, error: exerciseLinkError } = await supabase.from("patient_exercises").select("exercise_id").eq("patient_id", row.id);
      if (exerciseLinkError) throw exerciseLinkError;
      const exerciseIds = (exerciseLinks ?? []).map((item) => item.exercise_id);
      if (exerciseIds.length) {
        const { data, error } = await supabase.from("exercises").select("*").in("id", exerciseIds).eq("is_active", true);
        if (error) throw error; setExercises(data ?? []);
      } else setExercises([]);

      const { data: pdfLinks, error: pdfLinkError } = await supabase.from("patient_pdf_materials").select("pdf_material_id").eq("patient_id", row.id);
      if (pdfLinkError) throw pdfLinkError;
      const pdfIds = (pdfLinks ?? []).map((item) => item.pdf_material_id);
      if (pdfIds.length) {
        const { data, error } = await supabase.from("pdf_materials").select("*").in("id", pdfIds);
        if (error) throw error; setPdfs(data ?? []);
      } else setPdfs([]);

      const { data: docs, error: docsError } = await supabase.from("patient_documents").select("*").eq("patient_id", row.id).order("created_at", { ascending: false });
      if (docsError) throw docsError; setDocuments(docs ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível carregar seus conteúdos.");
    } finally { setLoading(false); }
  }

  async function openFile(bucket: string, path: string, id: string) {
    try {
      setOpening(id);
      const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, 600);
      if (error) throw error;
      window.open(data.signedUrl, "_blank", "noopener,noreferrer");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível abrir o arquivo.");
    } finally { setOpening(null); }
  }

  async function logout() { await signOut(); navigate({ to: "/", replace: true }); }

  return <main className="min-h-screen bg-[#faf8f4] text-[#2D2823]">
    <header className="sticky top-0 z-30 border-b border-[#eadfd1] bg-white/95 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <div><p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#A97A3C]">Área do paciente</p><h1 className="mt-1 text-lg font-semibold sm:text-xl">Erick Paulino Fisioterapia</h1></div>
        <Button type="button" onClick={logout} variant="outline" className="h-10 rounded-xl border-[#ead8c2] text-xs text-[#754600]"><LogOut className="size-4" />Sair</Button>
      </div>
    </header>
    <section className="mx-auto max-w-6xl px-4 py-7 sm:px-6 sm:py-10">
      {loading ? <div className="flex min-h-[50vh] items-center justify-center text-sm text-[#8c8178]"><RefreshCw className="mr-2 size-4 animate-spin text-[#BA9051]" />Carregando seus conteúdos...</div> : error ? <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">{error}</div> : patient ? <div className="space-y-7">
        <div className="rounded-[1.5rem] border border-[#e6d8c5] bg-white p-5 shadow-[0_10px_28px_rgba(64,48,30,0.06)] sm:p-7">
          <div className="flex items-start gap-4"><span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-[#fff4df] text-[#754600]"><ShieldCheck className="size-6" /></span><div><p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#A97A3C]">Bem-vindo</p><h2 className="mt-1 text-xl font-semibold sm:text-2xl">{patient.full_name}</h2><p className="mt-1 text-sm text-[#837970]">Aqui estão os conteúdos liberados pelo seu fisioterapeuta.</p></div></div>
        </div>
        <PortalSection title="Exercícios" subtitle="Vídeos liberados" count={exercises.length}>{exercises.length ? <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{exercises.map((item) => <article key={item.id} className="overflow-hidden rounded-2xl border border-[#e6d8c5] bg-white shadow-[0_8px_22px_rgba(64,48,30,0.05)]"><div className="relative aspect-video bg-[#f3eee7]">{item.thumbnail_url ? <img src={item.thumbnail_url} alt="" className="size-full object-cover" /> : <div className="flex size-full items-center justify-center text-[#A97A3C]"><Play className="size-8" /></div>}</div><div className="p-4"><h4 className="text-sm font-semibold">{item.name}</h4><p className="mt-1 line-clamp-2 text-xs text-[#837970]">{item.description || "Exercício orientado pelo fisioterapeuta."}</p>{item.video_url && <a href={item.video_url} target="_blank" rel="noreferrer" className="mt-3 inline-flex h-9 items-center gap-2 rounded-xl bg-[#BA9051] px-3 text-xs font-semibold text-white hover:bg-[#A97A3C]"><Play className="size-4" />Assistir vídeo</a>}</div></article>)}</div> : <Empty title="Nenhum exercício liberado" text="Seu fisioterapeuta ainda não vinculou vídeos para você." />}</PortalSection>
        <PortalSection title="Materiais" subtitle="PDFs liberados" count={pdfs.length}>{pdfs.length ? <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{pdfs.map((item) => <article key={item.id} className="rounded-2xl border border-[#e6d8c5] bg-white p-4 shadow-[0_8px_22px_rgba(64,48,30,0.05)]"><span className="flex size-11 items-center justify-center rounded-xl bg-[#fff4df] text-[#754600]"><FileText className="size-5" /></span><h4 className="mt-3 text-sm font-semibold">{item.name}</h4><p className="mt-1 line-clamp-2 text-xs text-[#837970]">{item.description || "Material disponibilizado pelo fisioterapeuta."}</p><button type="button" disabled={opening === item.id} onClick={() => { const parts = item.storage_path.split("/"); const bucket = parts.shift(); if (bucket) void openFile(bucket, parts.join("/"), item.id); }} className="mt-3 inline-flex h-9 items-center gap-2 rounded-xl border border-[#d9c29f] bg-[#fffaf2] px-3 text-xs font-semibold text-[#754600]">{opening === item.id ? "Abrindo..." : "Abrir PDF"}</button></article>)}</div> : <Empty title="Nenhum PDF liberado" text="Seu fisioterapeuta ainda não vinculou materiais para você." />}</PortalSection>
        <PortalSection title="Documentos" subtitle="Arquivos exclusivos" count={documents.length}>{documents.length ? <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{documents.map((item) => <article key={item.id} className="rounded-2xl border border-[#e6d8c5] bg-white p-4 shadow-[0_8px_22px_rgba(64,48,30,0.05)]"><span className="flex size-11 items-center justify-center rounded-xl bg-[#fff4df] text-[#754600]"><FileText className="size-5" /></span><h4 className="mt-3 text-sm font-semibold">{item.name}</h4><p className="mt-1 truncate text-xs text-[#837970]">{item.file_name}</p><button type="button" disabled={opening === item.id} onClick={() => void openFile("patient-documents", item.storage_path, item.id)} className="mt-3 inline-flex h-9 items-center gap-2 rounded-xl bg-[#BA9051] px-3 text-xs font-semibold text-white hover:bg-[#A97A3C]">{opening === item.id ? "Abrindo..." : "Abrir documento"}</button></article>)}</div> : <Empty title="Nenhum documento exclusivo" text="Ainda não há documentos específicos disponíveis para você." />}</PortalSection>
      </div> : null}
    </section>
  </main>;
}

function PortalSection({ title, subtitle, count, children }: { title: string; subtitle: string; count: number; children: React.ReactNode }) {
  return <section><div className="mb-3 flex items-end justify-between gap-3"><div><p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#A97A3C]">{title}</p><h3 className="mt-1 text-lg font-semibold">{subtitle}</h3></div><span className="rounded-full bg-[#f3e3cf] px-3 py-1 text-[10px] font-semibold text-[#754600]">{count}</span></div>{children}</section>;
}

function Empty({ title, text }: { title: string; text: string }) {
  return <div className="rounded-2xl border border-dashed border-[#dccbb5] bg-white p-8 text-center text-sm text-[#8c8178]"><p className="font-semibold text-[#5f574f]">{title}</p><p className="mt-1 text-xs">{text}</p></div>;
}

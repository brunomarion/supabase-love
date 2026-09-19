import { useState, type FormEvent } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { authErrorMessage } from "@/lib/auth-messages";

export const Route = createFileRoute("/redefinir-senha")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Redefinir senha | Erick Paulino Fisioterapia" },
      {
        name: "description",
        content: "Defina uma nova senha de acesso à plataforma Erick Paulino Fisioterapia.",
      },
      { property: "og:title", content: "Redefinir senha | Erick Paulino Fisioterapia" },
      { property: "og:description", content: "Defina uma nova senha de acesso." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (password.length < 6) {
      setError("A senha deve ter pelo menos 6 caracteres.");
      return;
    }
    if (password !== confirm) {
      setError("As senhas não conferem.");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) {
        setError(authErrorMessage(updateError));
        return;
      }
      toast.success("Senha atualizada com sucesso.");
      navigate({ to: "/painel", replace: true });
    } catch (err) {
      setError(authErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm">
        <p className="eyebrow">Recuperação de acesso</p>
        <h1 className="mt-3 font-display text-4xl font-light">Definir nova senha</h1>

        <form onSubmit={handleSubmit} noValidate className="mt-10 space-y-5">
          <div className="space-y-2">
            <Label htmlFor="new-password">Nova senha</Label>
            <Input
              id="new-password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={submitting}
              className="h-12 rounded-none border-0 border-b bg-transparent px-0 shadow-none focus-visible:ring-0 focus-visible:border-foreground"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm-password">Confirmar senha</Label>
            <Input
              id="confirm-password"
              type="password"
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              disabled={submitting}
              className="h-12 rounded-none border-0 border-b bg-transparent px-0 shadow-none focus-visible:ring-0 focus-visible:border-foreground"
            />
          </div>

          {error ? (
            <p role="alert" className="border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
              {error}
            </p>
          ) : null}

          <Button
            type="submit"
            disabled={submitting}
            className="h-12 w-full rounded-none text-xs tracking-[0.2em] uppercase"
          >
            {submitting ? <Loader2 className="size-4 animate-spin" /> : "Salvar nova senha"}
          </Button>
        </form>
      </div>
    </main>
  );
}

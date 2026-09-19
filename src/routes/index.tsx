import { useEffect, useState, type FormEvent } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import logo from "@/assets/logo-erick-paulino.jpg.asset.json";
import { authErrorMessage } from "@/lib/auth-messages";
import {
  getRememberedEmail,
  sendPasswordReset,
  setRememberedEmail,
  signInWithPassword,
} from "@/lib/auth";
import { useSession } from "@/hooks/use-session";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Entrar | Erick Paulino Fisioterapia" },
      {
        name: "description",
        content:
          "Acesso exclusivo do fisioterapeuta à plataforma Erick Paulino: entre com e-mail e senha.",
      },
      { property: "og:title", content: "Entrar | Erick Paulino Fisioterapia" },
      {
        property: "og:description",
        content: "Área restrita do fisioterapeuta. Acesse sua conta para continuar.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LoginPage,
});

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function LoginPage() {
  const navigate = useNavigate();
  const { session, loading: sessionLoading } = useSession();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; form?: string }>({});

  useEffect(() => {
    const saved = getRememberedEmail();
    if (saved) {
      setEmail(saved);
      setRemember(true);
    }
  }, []);

  useEffect(() => {
    if (!sessionLoading && session) {
      navigate({ to: "/painel", replace: true });
    }
  }, [session, sessionLoading, navigate]);

  function validate() {
    const next: { email?: string; password?: string } = {};
    if (!email.trim()) next.email = "Informe seu e-mail.";
    else if (!EMAIL_REGEX.test(email.trim())) next.email = "Digite um e-mail válido.";
    if (!password) next.password = "Informe sua senha.";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (submitting) return;
    if (!validate()) return;

    setSubmitting(true);
    setErrors({});
    try {
      const { error } = await signInWithPassword(email, password);
      if (error) {
        setErrors({ form: authErrorMessage(error) });
        return;
      }
      setRememberedEmail(remember ? email.trim() : null);
      toast.success("Login realizado com sucesso.");
      navigate({ to: "/painel", replace: true });
    } catch (error) {
      setErrors({ form: authErrorMessage(error) });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleForgotPassword() {
    if (!email.trim() || !EMAIL_REGEX.test(email.trim())) {
      setErrors({ email: "Digite seu e-mail para receber o link de recuperação." });
      return;
    }
    try {
      const { error } = await sendPasswordReset(email);
      if (error) {
        toast.error(authErrorMessage(error));
        return;
      }
      toast.success("Enviamos um link de recuperação para o seu e-mail.");
    } catch (error) {
      toast.error(authErrorMessage(error));
    }
  }

  return (
    <main className="grid min-h-screen lg:grid-cols-[1.05fr_1fr]">
      <section className="relative hidden flex-col justify-between bg-ink px-14 py-14 text-ivory lg:flex">
        <img
          src={logo.url}
          alt="Erick Paulino Fisioterapeuta"
          className="w-64 opacity-95 mix-blend-screen invert"
        />
        <div className="max-w-md">
          <p className="eyebrow text-ivory/50">Plataforma clínica</p>
          <h2 className="mt-5 font-display text-5xl leading-[1.1] font-light">
            Cuidado, movimento e acompanhamento em um só lugar.
          </h2>
          <p className="mt-6 text-sm leading-relaxed text-ivory/60">
            Ambiente restrito ao fisioterapeuta responsável pelos atendimentos.
          </p>
        </div>
        <p className="text-xs text-ivory/40">© {new Date().getFullYear()} Erick Paulino</p>
      </section>

      <section className="flex items-center justify-center px-6 py-12 sm:px-10">
        <div className="w-full max-w-sm">
          <img
            src={logo.url}
            alt="Erick Paulino Fisioterapeuta"
            className="mx-auto mb-10 w-52 lg:hidden"
          />

          <p className="eyebrow">Área do fisioterapeuta</p>
          <h1 className="mt-3 font-display text-4xl font-light sm:text-5xl">Bem-vindo de volta</h1>
          <p className="mt-3 text-sm text-muted-foreground">Acesse sua conta para continuar</p>

          <form onSubmit={handleSubmit} noValidate className="mt-10 space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="voce@clinica.com.br"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={submitting}
                aria-invalid={Boolean(errors.email)}
                className="h-12 rounded-none border-0 border-b bg-transparent px-0 shadow-none focus-visible:ring-0 focus-visible:border-foreground"
              />
              {errors.email ? (
                <p className="text-xs text-destructive">{errors.email}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={submitting}
                  aria-invalid={Boolean(errors.password)}
                  className="h-12 rounded-none border-0 border-b bg-transparent px-0 pr-10 shadow-none focus-visible:ring-0 focus-visible:border-foreground"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                  className="absolute right-0 top-1/2 -translate-y-1/2 p-2 text-muted-foreground transition-colors hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
              {errors.password ? (
                <p className="text-xs text-destructive">{errors.password}</p>
              ) : null}
            </div>

            <div className="flex items-center justify-between pt-1">
              <label className="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground">
                <Checkbox
                  checked={remember}
                  onCheckedChange={(value) => setRemember(value === true)}
                  disabled={submitting}
                />
                Lembrar de mim
              </label>
              <button
                type="button"
                onClick={handleForgotPassword}
                className="text-sm text-foreground underline-offset-4 hover:underline"
              >
                Esqueci minha senha
              </button>
            </div>

            {errors.form ? (
              <p
                role="alert"
                className="border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
              >
                {errors.form}
              </p>
            ) : null}

            <Button
              type="submit"
              disabled={submitting}
              className="h-12 w-full rounded-none text-xs tracking-[0.2em] uppercase"
            >
              {submitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Entrando
                </>
              ) : (
                "Entrar"
              )}
            </Button>
          </form>
        </div>
      </section>
    </main>
  );
}

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
    <main className="min-h-screen bg-[#f8f6f2] text-[#25211d] lg:grid lg:grid-cols-[0.9fr_1.1fr]">
      <section className="relative hidden overflow-hidden bg-[#ba9051] px-12 py-12 text-white lg:flex lg:flex-col lg:justify-between xl:px-16">
        <div className="absolute -right-32 top-1/3 size-80 rounded-full border border-white/20" />
        <div className="absolute -left-24 bottom-20 size-56 rounded-full border border-white/10" />

        <img
          src={logo.url}
          alt="Erick Paulino Fisioterapeuta"
          className="relative z-10 w-56 brightness-0 invert"
        />

        <div className="relative z-10 max-w-lg">
          <span className="text-xs font-medium uppercase tracking-[0.28em] text-white/70">
            Plataforma clínica
          </span>
          <h2 className="mt-6 font-display text-5xl font-light leading-[1.08] xl:text-6xl">
            Cuidado, movimento e acompanhamento.
          </h2>
          <p className="mt-6 max-w-md text-sm leading-7 text-white/75">
            Um ambiente exclusivo para organizar seus atendimentos e acompanhar seus pacientes.
          </p>
        </div>

        <p className="relative z-10 text-xs text-white/60">
          © {new Date().getFullYear()} Erick Paulino Fisioterapia
        </p>
      </section>

      <section className="flex min-h-screen items-center justify-center px-5 py-8 sm:px-8 lg:px-12">
        <div className="w-full max-w-md">
          <div className="mb-9 flex justify-center lg:hidden">
            <div className="flex size-28 items-center justify-center rounded-full bg-white p-5 shadow-[0_12px_35px_rgba(37,33,29,0.08)]">
              <img
                src={logo.url}
                alt="Erick Paulino Fisioterapeuta"
                className="max-h-full w-full object-contain"
              />
            </div>
          </div>

          <div className="rounded-3xl bg-white p-6 shadow-[0_20px_60px_rgba(37,33,29,0.08)] sm:p-9 lg:rounded-none lg:bg-transparent lg:p-0 lg:shadow-none">
            <div className="mb-8">
              <span className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#ba9051]">
                Área do fisioterapeuta
              </span>
              <h1 className="mt-3 font-display text-3xl font-light leading-tight sm:text-4xl">
                Bem-vindo de volta
              </h1>
              <p className="mt-3 text-sm leading-6 text-[#746c64]">
                Entre com seus dados para acessar sua plataforma.
              </p>
            </div>

            <form onSubmit={handleSubmit} noValidate className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-[#403a35]">
                  E-mail
                </Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="voce@clinica.com.br"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={submitting}
                  aria-invalid={Boolean(errors.email)}
                  className="h-12 rounded-xl border-[#e4ded6] bg-[#fbfaf8] px-4 text-sm shadow-none transition focus-visible:border-[#ba9051] focus-visible:ring-2 focus-visible:ring-[#ba9051]/15"
                />
                {errors.email ? (
                  <p className="text-xs text-destructive">{errors.email}</p>
                ) : null}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-[#403a35]">
                  Senha
                </Label>
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
                    className="h-12 rounded-xl border-[#e4ded6] bg-[#fbfaf8] px-4 pr-12 text-sm shadow-none transition focus-visible:border-[#ba9051] focus-visible:ring-2 focus-visible:ring-[#ba9051]/15"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-2 text-[#8a8178] transition hover:bg-[#ba9051]/10 hover:text-[#ba9051]"
                  >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
                {errors.password ? (
                  <p className="text-xs text-destructive">{errors.password}</p>
                ) : null}
              </div>

              <div className="flex flex-col gap-3 pt-1 min-[380px]:flex-row min-[380px]:items-center min-[380px]:justify-between">
                <label className="flex cursor-pointer items-center gap-2 text-sm text-[#746c64]">
                  <Checkbox
                    checked={remember}
                    onCheckedChange={(value) => setRemember(value === true)}
                    disabled={submitting}
                    className="data-[state=checked]:border-[#ba9051] data-[state=checked]:bg-[#ba9051] data-[state=checked]:text-white"
                  />
                  Lembrar de mim
                </label>
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="w-fit text-left text-sm font-medium text-[#ba9051] underline-offset-4 hover:underline"
                >
                  Esqueci minha senha
                </button>
              </div>

              {errors.form ? (
                <p
                  role="alert"
                  className="rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive"
                >
                  {errors.form}
                </p>
              ) : null}

              <Button
                type="submit"
                disabled={submitting}
                className="h-12 w-full rounded-xl bg-[#ba9051] text-sm font-semibold text-white shadow-[0_10px_25px_rgba(186,144,81,0.25)] transition hover:bg-[#a98148] hover:shadow-[0_12px_30px_rgba(186,144,81,0.32)]"
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

            <div className="mt-8 flex items-center justify-center gap-2 text-[11px] uppercase tracking-[0.18em] text-[#a39a91]">
              <span className="h-px w-8 bg-[#e4ded6]" />
              Acesso seguro
              <span className="h-px w-8 bg-[#e4ded6]" />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

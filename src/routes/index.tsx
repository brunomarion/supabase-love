import { useEffect, useState, type FormEvent } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
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
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Poppins:wght@500;600;700&display=swap" },
    ],
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
    <main className="h-[100dvh] overflow-hidden bg-[#f8f6f2] text-[#25211d] lg:grid lg:grid-cols-[0.9fr_1.1fr]">
      <section className="relative hidden min-h-screen overflow-hidden bg-[#ba9051] lg:flex lg:items-center lg:justify-center">
        <div className="absolute -right-40 top-1/4 size-[34rem] rounded-full border border-white/15" />
        <div className="absolute -left-32 bottom-10 size-80 rounded-full border border-white/10" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.12),transparent_55%)]" />
        <div className="relative z-10 flex h-full w-full items-center justify-center p-10 xl:p-16">
          <img
            src="/images/logo-editada-chatgpt.png"
            alt="Erick Paulino Fisioterapeuta"
            className="h-auto w-full max-w-[min(78%,620px)] object-contain drop-shadow-[0_22px_45px_rgba(73,51,24,0.16)]"
          />
        </div>
      </section>

      <section className="flex h-[100dvh] items-center justify-center overflow-hidden px-4 py-3 sm:px-8 sm:py-6 lg:px-12">
        <div className="w-full max-w-md">
          <div className="mb-1 flex -translate-y-2 justify-center lg:hidden sm:mb-4 sm:-translate-y-2">
            <img
              src="/images/logo-editada-chatgpt.png"
              alt="Erick Paulino Fisioterapeuta"
              className="h-auto max-h-[22vh] w-[min(72vw,300px)] object-contain drop-shadow-[0_18px_35px_rgba(37,33,29,0.12)]"
            />
          </div>

          <div className="mx-auto w-[calc(100%-1rem)] rounded-3xl bg-white p-5 shadow-[0_20px_60px_rgba(37,33,29,0.08)] sm:w-full sm:p-7 lg:rounded-none lg:bg-transparent lg:p-0 lg:shadow-none">
            <div className="mb-5 text-center lg:mb-8 lg:text-center">
              <h1 className="text-3xl font-semibold leading-tight tracking-[-0.03em] text-[#2d2823] sm:text-4xl" style={{ fontFamily: "Poppins, sans-serif" }}>
                Faça seu login
              </h1>
            </div>

            <form onSubmit={handleSubmit} noValidate className="space-y-4 sm:space-y-5">
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
                  className="h-14 rounded-2xl border-[#e7dfd4] bg-white/80 px-4 text-sm shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_8px_25px_rgba(37,33,29,0.05)] backdrop-blur-sm transition-all duration-300 placeholder:text-[#b7aea4] hover:border-[#d4c2aa] focus-visible:border-[#ba9051] focus-visible:bg-white focus-visible:ring-4 focus-visible:ring-[#ba9051]/10 focus-visible:shadow-[0_10px_30px_rgba(186,144,81,0.12)]"
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
                    className="h-14 rounded-2xl border-[#e7dfd4] bg-white/80 px-4 pr-12 text-sm shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_8px_25px_rgba(37,33,29,0.05)] backdrop-blur-sm transition-all duration-300 placeholder:text-[#b7aea4] hover:border-[#d4c2aa] focus-visible:border-[#ba9051] focus-visible:bg-white focus-visible:ring-4 focus-visible:ring-[#ba9051]/10 focus-visible:shadow-[0_10px_30px_rgba(186,144,81,0.12)]"
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

            <div className="mt-5 space-y-3 text-center">
              <div className="flex items-center justify-center gap-2 text-[11px] uppercase tracking-[0.18em] text-[#a39a91]">
                <span className="h-px w-8 bg-[#e4ded6]" />
                Acesso seguro
                <span className="h-px w-8 bg-[#e4ded6]" />
              </div>
              <div className="flex items-center justify-center gap-2 text-[10px] font-medium tracking-wide text-[#9a9188]">
                <span className="inline-flex items-center gap-1 rounded-full border border-[#e4ded6] bg-[#faf8f5] px-2.5 py-1">
                  <span className="text-[#ba9051]">✓</span> Acesso protegido
                </span>
                <span className="inline-flex items-center gap-1 rounded-full border border-[#e4ded6] bg-[#faf8f5] px-2.5 py-1">
                  <span className="text-[#ba9051]">⌁</span> Conexão segura
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

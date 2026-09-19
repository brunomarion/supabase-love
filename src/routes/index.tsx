import { useEffect, useState, type FormEvent } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Eye, EyeOff, Loader2, LockKeyhole, Mail, ShieldCheck } from "lucide-react";
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

  useEffect(() => {
    if (typeof window === "undefined") return;

    const html = document.documentElement;
    const body = document.body;

    const lockMobileScroll = () => {
      if (window.innerWidth >= 1024) return;
      html.style.overflow = "hidden";
      html.style.height = "100%";
      body.style.overflow = "hidden";
      body.style.height = "100%";
      body.style.position = "fixed";
      body.style.width = "100%";
      body.style.top = "0";
      body.style.left = "0";
    };

    const unlockMobileScroll = () => {
      if (window.innerWidth >= 1024) return;
      html.style.overflow = "";
      html.style.height = "";
      body.style.overflow = "";
      body.style.height = "";
      body.style.position = "";
      body.style.width = "";
      body.style.top = "";
      body.style.left = "";
      window.scrollTo(0, 0);
    };

    const inputs = Array.from(
      document.querySelectorAll<HTMLInputElement>("#email, #password"),
    );

    inputs.forEach((input) => {
      input.addEventListener("focus", lockMobileScroll);
      input.addEventListener("blur", unlockMobileScroll);
    });

    return () => {
      inputs.forEach((input) => {
        input.removeEventListener("focus", lockMobileScroll);
        input.removeEventListener("blur", unlockMobileScroll);
      });
      unlockMobileScroll();
    };
  }, []);

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
    <main className="fixed inset-0 h-[100dvh] w-full overflow-hidden bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.20),transparent_34%),radial-gradient(circle_at_10%_90%,rgba(255,255,255,0.10),transparent_30%),linear-gradient(145deg,#a77c42_0%,#ba9051_42%,#c9a064_70%,#9a713b_100%)] text-[#25211d] lg:static lg:grid lg:grid-cols-2 lg:min-h-screen lg:h-auto lg:bg-white">
      <div className="pointer-events-none absolute inset-0 lg:hidden" aria-hidden="true">
        <div className="absolute -left-20 -top-24 size-64 rounded-full border border-white/10 bg-white/5 blur-2xl" />
        <div className="absolute -bottom-28 -right-20 size-72 rounded-full border border-white/10 bg-[#7d5a30]/20 blur-3xl" />
        <div className="absolute left-1/2 top-1/2 h-[70%] w-px -translate-x-1/2 bg-gradient-to-b from-transparent via-white/10 to-transparent" />
      </div>

      <section
        className="relative hidden min-h-screen overflow-hidden lg:flex lg:items-center lg:justify-center"
        style={{
          background:
            "radial-gradient(circle at center, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0.06) 28%, transparent 52%), linear-gradient(135deg, #8d6838 0%, #ba9051 28%, #d4b078 50%, #ba9051 72%, #7d5a30 100%)",
        }}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.18),transparent_38%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(0,0,0,0.12),transparent_35%,transparent_65%,rgba(0,0,0,0.12))]" />
        <div className="relative z-10 flex h-full w-full items-center justify-center p-10 xl:p-16">
          <img
            src="/images/logo-editada-chatgpt.png"
            alt="Erick Paulino Fisioterapeuta"
            className="h-auto w-full max-w-[min(82%,680px)] object-contain drop-shadow-[0_24px_45px_rgba(47,31,15,0.42)]"
          />
        </div>
      </section>

      <section className="relative z-10 flex h-[100dvh] w-full items-center justify-center overflow-hidden bg-transparent px-1.5 py-0.5 sm:px-8 sm:py-6 lg:min-h-screen lg:h-auto lg:bg-white lg:px-12">
        <div className="w-full max-w-md">
          <div className="flex -translate-y-1 justify-center lg:hidden sm:-translate-y-2">
            <img
              src="/images/logo-editada-chatgpt.png"
              alt="Erick Paulino Fisioterapeuta"
              className="h-auto max-h-[23vh] w-[min(78vw,315px)] object-contain drop-shadow-[0_20px_38px_rgba(55,37,18,0.34)]"
            />
          </div>

          <div className="mx-auto w-[calc(100%-2rem)] max-w-[340px] rounded-[1.55rem] border border-[#d8c09f] bg-[radial-gradient(circle_at_88%_0%,rgba(186,144,81,0.22),transparent_34%),linear-gradient(145deg,#ffffff_0%,#fffdf9_48%,#f3eadf_100%)] p-3.5 shadow-[0_22px_55px_rgba(55,35,15,0.34),0_10px_28px_rgba(186,144,81,0.20),inset_0_1px_0_rgba(255,255,255,0.95),inset_0_-1px_0_rgba(186,144,81,0.10)] backdrop-blur-xl sm:w-full sm:max-w-md sm:rounded-3xl sm:p-7 lg:max-w-md lg:rounded-[2.15rem] lg:border lg:border-[#e6d8c5] lg:bg-[radial-gradient(circle_at_top_right,rgba(186,144,81,0.18),transparent_38%),linear-gradient(145deg,#ffffff_0%,#fcfaf7_52%,#f5eee4_100%)] lg:p-10 lg:shadow-[0_32px_90px_rgba(64,48,30,0.16),0_8px_24px_rgba(186,144,81,0.08)]">
            <div className="mb-3 text-center lg:mb-8 lg:text-center">
              <h1 className="text-3xl font-semibold leading-tight tracking-[-0.04em] text-[#2d2823] sm:text-4xl" style={{ fontFamily: "Poppins, sans-serif" }}>
                Faça seu <span className="text-[#ba9051] lg:text-[#2d2823]">login</span>
              </h1>
            </div>

            <form onSubmit={handleSubmit} noValidate className="space-y-3 sm:space-y-5 lg:space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-[#403a35]">
                  E-mail
                </Label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-4 top-1/2 z-10 size-4 -translate-y-1/2 text-[#a98558] lg:hidden" strokeWidth={1.8} />
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="voce@clinica.com.br"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={submitting}
                  aria-invalid={Boolean(errors.email)}
                  className="h-14 rounded-2xl border-[#dfd3c3] bg-white/90 px-4 pl-11 text-sm shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_8px_25px_rgba(37,33,29,0.05)] backdrop-blur-sm transition-all duration-300 placeholder:text-[#b7aea4] hover:border-[#d4c2aa] focus-visible:border-[#ba9051] focus-visible:bg-white focus-visible:ring-4 focus-visible:ring-[#ba9051]/10 focus-visible:shadow-[0_10px_30px_rgba(186,144,81,0.16)] lg:pl-4"
                />
                </div>
                {errors.email ? (
                  <p className="text-xs text-destructive">{errors.email}</p>
                ) : null}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-[#403a35]">
                  Senha
                </Label>
                <div className="relative">
                  <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 z-10 size-4 -translate-y-1/2 text-[#a98558] lg:hidden" strokeWidth={1.8} />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={submitting}
                    aria-invalid={Boolean(errors.password)}
                    className="h-14 rounded-2xl border-[#dfd3c3] bg-white/90 px-4 pl-11 pr-12 text-sm shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_8px_25px_rgba(37,33,29,0.05)] backdrop-blur-sm transition-all duration-300 placeholder:text-[#b7aea4] hover:border-[#d4c2aa] focus-visible:border-[#ba9051] focus-visible:bg-white focus-visible:ring-4 focus-visible:ring-[#ba9051]/10 focus-visible:shadow-[0_10px_30px_rgba(186,144,81,0.12)] lg:pl-4"
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
                className="h-12 w-full rounded-xl bg-[linear-gradient(135deg,#c69a59_0%,#a97a3c_100%)] text-sm font-semibold text-white shadow-[0_10px_25px_rgba(132,88,35,0.26)] transition hover:bg-[#a98148] hover:shadow-[0_12px_30px_rgba(186,144,81,0.34)] lg:bg-[#ba9051]"
              >
                {submitting ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Entrando
                  </>
                ) : (
                  <>Entrar<span className="ml-2 lg:hidden">→</span></>
                )}
              </Button>
            </form>

            <div className="mt-3 space-y-2.5 text-center lg:mt-5 lg:space-y-3">
              <div className="flex items-center justify-center gap-2 text-[11px] uppercase tracking-[0.18em] text-[#a39a91]">
                <span className="h-px w-8 bg-[#e4ded6]" />
                Acesso seguro
                <span className="h-px w-8 bg-[#e4ded6]" />
              </div>
              <div className="flex items-stretch justify-center gap-3 text-left lg:gap-7">
                <div className="flex items-center gap-2.5 lg:gap-3.5">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-[#ba9051]/45 bg-[#ba9051]/5 text-[#ba9051] lg:size-11 lg:rounded-xl">
                    <ShieldCheck className="size-4 lg:size-6" strokeWidth={1.8} />
                  </span>
                  <span className="flex flex-col">
                    <span className="text-[10px] font-semibold leading-tight text-[#4d463f] lg:text-xs">Acesso protegido</span>
                    <span className="mt-0.5 text-[8px] font-normal leading-tight text-[#9a9188] lg:text-[10px]">Ambiente criptografado</span>
                  </span>
                </div>
                <span className="w-px bg-[#e4ded6]" aria-hidden="true" />
                <div className="flex items-center gap-2.5 lg:gap-3.5">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-[#ba9051]/45 bg-[#ba9051]/5 text-[#ba9051] lg:size-11 lg:rounded-xl">
                    <LockKeyhole className="size-4 lg:size-6" strokeWidth={1.8} />
                  </span>
                  <span className="flex flex-col">
                    <span className="text-[11px] font-semibold leading-tight text-[#4d463f] lg:text-xs">Conexão segura</span>
                    <span className="mt-0.5 text-[9px] font-normal leading-tight text-[#9a9188] lg:text-[10px]">Seus dados protegidos</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

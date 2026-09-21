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
    <main className="fixed inset-0 h-[100dvh] w-full overflow-hidden bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.22),transparent_30%),radial-gradient(circle_at_100%_100%,rgba(125,90,48,0.22),transparent_38%),linear-gradient(145deg,#a77c42_0%,#ba9051_42%,#c9a064_72%,#9a713b_100%)] text-[#25211d] lg:static lg:grid lg:grid-cols-2 lg:min-h-screen lg:h-auto lg:bg-white">
      <div className="pointer-events-none absolute inset-0 lg:hidden" aria-hidden="true">
        <div className="absolute -left-20 -top-24 size-64 rounded-full border border-white/10 bg-white/5 blur-2xl" />
        <div className="absolute -bottom-28 -right-20 size-72 rounded-full border border-white/10 bg-[#7d5a30]/20 blur-3xl" />
        <div className="absolute left-1/2 top-1/2 h-[70%] w-px -translate-x-1/2 bg-gradient-to-b from-transparent via-white/10 to-transparent" />
        <div className="absolute -bottom-24 -left-16 h-40 w-[125%] rotate-[18deg] rounded-[50%] border-t border-white/20" />
        <div className="absolute -bottom-28 -right-20 h-44 w-[125%] -rotate-[12deg] rounded-[50%] border-t border-white/10" />
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

      <section className="relative z-10 flex h-[100dvh] w-full overflow-hidden bg-transparent px-0 lg:min-h-screen lg:h-auto lg:flex lg:flex-row lg:items-center lg:justify-center lg:bg-white lg:px-12">
        <div className="relative h-full w-full max-w-[520px] lg:h-auto lg:max-w-md">
          <div className="absolute left-1/2 top-0 z-20 flex w-full -translate-x-1/2 items-center justify-center px-4 pt-0 lg:hidden">
            <img
              src="/images/logo-editada-chatgpt.png"
              alt="Erick Paulino Fisioterapeuta"
              className="h-auto max-h-[21vh] w-[min(82vw,320px)] object-contain drop-shadow-[0_18px_34px_rgba(55,37,18,0.34)]"
            />
          </div>

          <div className="absolute left-1/2 top-1/2 w-full -translate-x-1/2 -translate-y-1/2 rounded-[1.4rem] border-0 bg-transparent p-1 shadow-none backdrop-blur-0 sm:w-full sm:max-w-md sm:rounded-3xl p-4 sm:p-7 lg:static lg:max-w-md lg:translate-x-0 lg:translate-y-0 lg:rounded-[2.15rem] lg:border lg:border-[#e6d8c5] lg:bg-[radial-gradient(circle_at_top_right,rgba(186,144,81,0.18),transparent_38%),linear-gradient(145deg,#ffffff_0%,#fcfaf7_52%,#f5eee4_100%)] lg:p-10 lg:shadow-[0_32px_90px_rgba(64,48,30,0.16),0_8px_24px_rgba(186,144,81,0.08)]">
            <div className="mb-3 text-center lg:mb-8 lg:text-center">
              <h1 className="text-[1.45rem] font-semibold leading-tight tracking-[-0.04em] text-white sm:text-4xl lg:text-[#2d2823]" style={{ fontFamily: "Poppins, sans-serif" }}>
                Acesse sua conta
              </h1>
            </div>

            <form onSubmit={handleSubmit} noValidate className="mx-auto w-full space-y-2.5 sm:w-full sm:space-y-5 lg:space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-white lg:text-sm lg:text-[#403a35]">
                  E-mail
                </Label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-4 top-1/2 z-10 size-4 -translate-y-1/2 text-[#a98558] lg:hidden" strokeWidth={1.8} />
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="voce@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={submitting}
                  aria-invalid={Boolean(errors.email)}
                  className="h-11 rounded-xl border-white/80 bg-white px-4 pl-11 text-base text-[#3a332d] shadow-[0_8px_22px_rgba(62,39,16,0.14),inset_0_1px_0_rgba(255,255,255,1)] backdrop-blur-sm transition-all duration-300 placeholder:text-[#a49a90] hover:border-[#f5dfb4] focus-visible:border-[#f5dfb4] focus-visible:bg-white focus-visible:ring-4 focus-visible:ring-[#f5dfb4]/25 focus-visible:shadow-[0_10px_30px_rgba(62,39,16,0.18)] lg:border-[#dfd3c3] lg:bg-white/90 lg:px-4 lg:pl-4 lg:text-sm lg:shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_8px_25px_rgba(37,33,29,0.05)] lg:focus-visible:border-[#ba9051] lg:focus-visible:ring-[#ba9051]/10 lg:focus-visible:shadow-[0_10px_30px_rgba(186,144,81,0.16)]"
                />
                </div>
                {errors.email ? (
                  <p className="text-xs text-destructive">{errors.email}</p>
                ) : null}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-white lg:text-sm lg:text-[#403a35]">
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
                    className="h-11 rounded-xl border-white/80 bg-white px-4 pl-11 pr-12 text-base text-[#3a332d] shadow-[0_8px_22px_rgba(62,39,16,0.14),inset_0_1px_0_rgba(255,255,255,1)] backdrop-blur-sm transition-all duration-300 placeholder:text-[#a49a90] hover:border-[#f5dfb4] focus-visible:border-[#f5dfb4] focus-visible:bg-white focus-visible:ring-4 focus-visible:ring-[#f5dfb4]/25 focus-visible:shadow-[0_10px_30px_rgba(62,39,16,0.18)] lg:border-[#dfd3c3] lg:bg-white/90 lg:pl-4 lg:text-sm lg:shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_8px_25px_rgba(37,33,29,0.05)] lg:focus-visible:border-[#ba9051] lg:focus-visible:ring-[#ba9051]/10 lg:focus-visible:shadow-[0_10px_30px_rgba(186,144,81,0.12)]"
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

              <div className="flex flex-col gap-2 pt-0.5 min-[380px]:flex-row min-[380px]:items-center min-[380px]:justify-between">
                <label className="flex cursor-pointer items-center gap-2 text-xs text-white sm:text-sm lg:text-[#746c64]">
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
                  className="w-fit text-left text-xs font-medium text-[#f4d79f] underline-offset-4 hover:underline sm:text-sm lg:text-[#ba9051]"
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
                className="mt-2 h-11 w-full rounded-xl border border-[#f1cc7d] bg-[linear-gradient(135deg,#7b542a_0%,#4f3218_100%)] text-base font-semibold text-white shadow-[0_12px_30px_rgba(57,34,13,0.38),0_0_0_1px_rgba(244,215,159,0.16)] transition-all hover:-translate-y-0.5 hover:border-[#ffe0a0] hover:shadow-[0_15px_34px_rgba(57,34,13,0.45),0_0_18px_rgba(244,215,159,0.16)] sm:h-12 lg:border-0 lg:bg-[#ba9051] lg:shadow-[0_10px_25px_rgba(132,88,35,0.26)] lg:mt-0 lg:hover:translate-y-0 lg:hover:border-transparent lg:hover:bg-[#a98148] lg:hover:shadow-[0_12px_30px_rgba(186,144,81,0.34)]"
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

            <div className="mt-3 space-y-2 text-center sm:mt-3 lg:mt-5 lg:space-y-3">
              <div className="flex items-center justify-center gap-2 text-[11px] uppercase tracking-[0.18em] text-white/75 lg:text-[#a39a91]">
                <span className="h-px w-8 bg-white/25 lg:bg-[#e4ded6]" />
                Acesso seguro
                <span className="h-px w-8 bg-[#e4ded6]" />
              </div>
              <div className="flex items-stretch justify-center gap-4 text-left lg:gap-7">
                <div className="flex items-center gap-3 lg:gap-3.5">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-[#f3d08b] bg-[#f8e9ca] text-[#6b4523] shadow-[0_5px_14px_rgba(58,35,14,0.16)] lg:size-11 lg:rounded-xl">
                    <ShieldCheck className="size-5 lg:size-6" strokeWidth={1.8} />
                  </span>
                  <span className="flex flex-col">
                    <span className="text-[11px] font-semibold leading-tight text-white lg:text-xs lg:text-[#4d463f]">Acesso protegido</span>
                    <span className="mt-0.5 text-[9px] font-normal leading-tight text-white/80 lg:text-[10px] lg:text-[#9a9188]">Ambiente criptografado</span>
                  </span>
                </div>
                <span className="w-px bg-white/35 lg:bg-[#e4ded6]" aria-hidden="true" />
                <div className="flex items-center gap-2.5 lg:gap-3.5">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-[#f3d08b] bg-[#f8e9ca] text-[#6b4523] shadow-[0_5px_14px_rgba(58,35,14,0.16)] lg:size-11 lg:rounded-xl">
                    <LockKeyhole className="size-5 lg:size-6" strokeWidth={1.8} />
                  </span>
                  <span className="flex flex-col">
                    <span className="text-[12px] font-semibold leading-tight text-white lg:text-xs lg:text-[#4d463f]">Conexão segura</span>
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

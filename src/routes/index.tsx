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
        content: "Área restrita do fisioterapeuta. Faça o seu login para continuar.",
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
    <motion.main initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.55, ease: "easeOut" }} className="fixed inset-0 h-[100dvh] w-full overflow-hidden bg-[linear-gradient(to_top,#a77c42_0%,#ba9051_42%,#c9a064_72%,#9a713b_100%)] text-[#25211d] lg:static lg:grid lg:grid-cols-2 lg:min-h-screen lg:h-auto lg:bg-white">
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
              className="h-auto max-h-[20vh] w-[min(82vw,310px)] object-contain drop-shadow-[0_14px_28px_rgba(55,37,18,0.30)]"
            />
          </div>

          <div className="absolute left-1/2 top-[50%] w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 rounded-[1.4rem] border-0 bg-transparent p-1 shadow-none backdrop-blur-0 sm:w-full sm:max-w-md sm:rounded-3xl p-4 sm:p-7 lg:static lg:max-w-md lg:translate-x-0 lg:translate-y-0 lg:rounded-[2.15rem] lg:border lg:border-[#e6d8c5] lg:bg-[radial-gradient(circle_at_top_right,rgba(186,144,81,0.18),transparent_38%),linear-gradient(145deg,#ffffff_0%,#fcfaf7_52%,#f5eee4_100%)] lg:p-10 lg:shadow-[0_32px_90px_rgba(64,48,30,0.16),0_8px_24px_rgba(186,144,81,0.08)]">
            <div className="mb-3 text-center lg:mb-8 lg:text-center">
              <h1 className="text-[1.55rem] font-semibold leading-tight tracking-[-0.045em] text-white drop-shadow-[0_3px_12px_rgba(66,39,13,0.38)] sm:text-4xl lg:text-[#2d2823] lg:drop-shadow-none" style={{ fontFamily: "Poppins, sans-serif" }}>
                Faça o seu login
              </h1>
              <div className="mx-auto mt-2 h-[2px] w-20 rounded-full bg-gradient-to-r from-transparent via-[#f3d08b] to-transparent shadow-[0_0_12px_rgba(243,208,139,0.5)] lg:mt-3 lg:bg-gradient-to-r lg:from-transparent lg:via-[#ba9051] lg:to-transparent lg:shadow-none" />
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
                  className="h-11 rounded-xl border-white/80 bg-white px-4 pl-11 text-base text-[#3a332d] shadow-[0_8px_22px_rgba(62,39,16,0.14),inset_0_1px_0_rgba(255,255,255,1)] backdrop-blur-sm transition-all duration-300 placeholder:text-[#a49a90] hover:-translate-y-px hover:border-[#f1d39b] hover:shadow-[0_12px_28px_rgba(62,39,16,0.18),inset_0_1px_0_rgba(255,255,255,1)] focus-visible:-translate-y-px focus-visible:border-[#e7bc6c] focus-visible:bg-white focus-visible:ring-4 focus-visible:ring-[#f1d39f]/30 focus-visible:shadow-[0_14px_34px_rgba(62,39,16,0.2),0_0_0_1px_rgba(231,188,108,0.2),inset_0_1px_0_rgba(255,255,255,1)] lg:border-[#dfd3c3] lg:bg-white/90 lg:px-4 lg:pl-4 lg:text-sm lg:shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_8px_25px_rgba(37,33,29,0.05)] lg:focus-visible:border-[#ba9051] lg:focus-visible:ring-[#ba9051]/10 lg:focus-visible:shadow-[0_10px_30px_rgba(186,144,81,0.16)]"
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
                    className="h-11 rounded-xl border-white/80 bg-white px-4 pl-11 pr-12 text-base text-[#3a332d] shadow-[0_8px_22px_rgba(62,39,16,0.14),inset_0_1px_0_rgba(255,255,255,1)] backdrop-blur-sm transition-all duration-300 placeholder:text-[#a49a90] hover:-translate-y-px hover:border-[#f1d39b] hover:shadow-[0_12px_28px_rgba(62,39,16,0.18),inset_0_1px_0_rgba(255,255,255,1)] focus-visible:-translate-y-px focus-visible:border-[#e7bc6c] focus-visible:bg-white focus-visible:ring-4 focus-visible:ring-[#f1d39f]/30 focus-visible:shadow-[0_14px_34px_rgba(62,39,16,0.2),0_0_0_1px_rgba(231,188,108,0.2),inset_0_1px_0_rgba(255,255,255,1)] lg:border-[#dfd3c3] lg:bg-white/90 lg:pl-4 lg:text-sm lg:shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_8px_25px_rgba(37,33,29,0.05)] lg:focus-visible:border-[#ba9051] lg:focus-visible:ring-[#ba9051]/10 lg:focus-visible:shadow-[0_10px_30px_rgba(186,144,81,0.12)]"
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
                <label className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-xs font-medium text-white transition-all duration-200 hover:bg-white/10 active:scale-[0.98] sm:text-sm lg:rounded-none lg:bg-transparent lg:px-0 lg:py-0 lg:text-[#746c64] lg:hover:bg-transparent lg:active:scale-100">
                  <Checkbox
                    checked={remember}
                    onCheckedChange={(value) => setRemember(value === true)}
                    disabled={submitting}
                    className="size-5 rounded-full border-2 border-white/80 bg-white/20 shadow-[0_3px_10px_rgba(57,34,13,0.22)] transition-all duration-200 hover:border-[#ffe0a0] hover:bg-white/30 data-[state=checked]:border-[#f6d28e] data-[state=checked]:bg-[#ba9051] data-[state=checked]:text-white data-[state=checked]:shadow-[0_0_0_3px_rgba(244,215,159,0.18),0_4px_12px_rgba(57,34,13,0.28)] lg:size-4 lg:rounded-sm lg:border-[#ba9051] lg:bg-transparent lg:shadow-none lg:hover:bg-[#ba9051]/10 lg:data-[state=checked]:border-[#ba9051] lg:data-[state=checked]:bg-[#ba9051] lg:data-[state=checked]:shadow-none"
                  />
                  Lembrar de mim
                </label>
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="w-fit rounded-lg px-2 py-1.5 text-left text-xs font-semibold text-[#ffe3ad] underline-offset-4 transition-all duration-200 hover:bg-white/10 hover:text-white hover:underline active:scale-[0.98] sm:text-sm lg:rounded-none lg:bg-transparent lg:px-0 lg:py-0 lg:text-[#ba9051] lg:hover:bg-transparent lg:hover:text-[#a98148] lg:active:scale-100"
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
                className="mt-7 h-11 w-full rounded-xl border border-[#f6d28e] bg-[linear-gradient(135deg,#8b6232_0%,#5a391b_48%,#3f2612_100%)] text-base font-semibold text-white shadow-[0_12px_30px_rgba(57,34,13,0.38),0_2px_0_rgba(255,255,255,0.12)_inset,0_0_0_1px_rgba(244,215,159,0.18)] transition-all duration-300 hover:-translate-y-0.5 hover:border-[#ffe3a8] hover:bg-[linear-gradient(135deg,#9b713c_0%,#64411f_48%,#472b15_100%)] hover:shadow-[0_16px_38px_rgba(57,34,13,0.46),0_0_22px_rgba(244,215,159,0.18)] active:translate-y-0 active:scale-[0.99] active:shadow-[0_8px_18px_rgba(57,34,13,0.34),0_0_12px_rgba(244,215,159,0.12)] sm:h-12 lg:border-0 lg:bg-[#ba9051] lg:shadow-[0_10px_25px_rgba(132,88,35,0.26)] lg:mt-0 lg:hover:translate-y-0 lg:hover:border-transparent lg:hover:bg-[#a98148] lg:hover:shadow-[0_12px_30px_rgba(186,144,81,0.34)]"
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

            <div className="mt-6 space-y-2 text-center sm:mt-3 lg:mt-5 lg:space-y-3">
              <div className="flex items-center justify-center gap-2 text-[11px] uppercase tracking-[0.18em] text-white/75 lg:text-[#a39a91]">
                <span className="h-px w-8 bg-white/25 lg:bg-[#e4ded6]" />
                Acesso seguro
                <span className="h-px w-8 bg-[#e4ded6]" />
              </div>
              <div className="flex w-full items-stretch justify-between gap-4 text-left lg:justify-center lg:gap-7">
                <div className="flex items-center gap-3 lg:gap-3.5">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-[#f3d08b] bg-[#f8e9ca] text-[#6b4523] shadow-[0_5px_14px_rgba(58,35,14,0.16)] lg:size-11 lg:rounded-xl">
                    <ShieldCheck className="size-5 lg:size-6" strokeWidth={1.8} />
                  </span>
                  <span className="flex flex-col">
                    <span className="text-sm font-semibold leading-tight text-white lg:text-xs lg:text-[#4d463f]">Acesso protegido</span>
                    
                  </span>
                </div>
                <span className="w-px bg-white/35 lg:bg-[#e4ded6]" aria-hidden="true" />
                <div className="ml-auto flex items-center gap-2.5 lg:gap-3.5">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-[#f3d08b] bg-[#f8e9ca] text-[#6b4523] shadow-[0_5px_14px_rgba(58,35,14,0.16)] lg:size-11 lg:rounded-xl">
                    <LockKeyhole className="size-5 lg:size-6" strokeWidth={1.8} />
                  </span>
                  <span className="flex flex-col">
                    <span className="text-sm font-semibold leading-tight text-white lg:text-xs lg:text-[#4d463f]">Conexão segura</span>
                    
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </motion.main>
  );
}

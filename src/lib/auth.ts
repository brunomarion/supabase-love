import { supabase } from "@/integrations/supabase/client";

const REMEMBERED_EMAIL_KEY = "ep.remembered-email";

export function normalizeCpf(value: string) {
  return value.replace(/\D/g, "").slice(0, 11);
}

export function cpfToAuthEmail(cpf: string) {
  return `${normalizeCpf(cpf)}@patient.erickfisio.local`;
}

export async function signInWithPassword(identifier: string, password: string) {
  const value = identifier.trim();
  const isCpf = normalizeCpf(value).length === 11 && !value.includes("@");
  return supabase.auth.signInWithPassword({
    email: isCpf ? cpfToAuthEmail(value) : value,
    password,
  });
}

export async function sendPasswordReset(email: string) {
  return supabase.auth.resetPasswordForEmail(email.trim(), {
    redirectTo: `${window.location.origin}/redefinir-senha`,
  });
}

export async function signOut() {
  return supabase.auth.signOut();
}

export function getRememberedEmail(): string {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem(REMEMBERED_EMAIL_KEY) ?? "";
}

export function setRememberedEmail(email: string | null) {
  if (typeof window === "undefined") return;
  if (email) window.localStorage.setItem(REMEMBERED_EMAIL_KEY, email);
  else window.localStorage.removeItem(REMEMBERED_EMAIL_KEY);
}

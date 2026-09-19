/** Mensagens de erro de autenticação em português. */
export function authErrorMessage(error: unknown): string {
  const raw =
    typeof error === "object" && error !== null && "message" in error
      ? String((error as { message: unknown }).message)
      : "";

  const message = raw.toLowerCase();

  if (message.includes("invalid login credentials")) {
    return "E-mail ou senha incorretos.";
  }
  if (message.includes("email not confirmed")) {
    return "Confirme seu e-mail antes de acessar.";
  }
  if (message.includes("too many requests") || message.includes("rate limit")) {
    return "Muitas tentativas. Aguarde alguns instantes e tente novamente.";
  }
  if (
    message.includes("failed to fetch") ||
    message.includes("networkerror") ||
    message.includes("network request failed")
  ) {
    return "Não foi possível conectar ao servidor. Verifique sua conexão.";
  }
  if (message.includes("missing supabase environment")) {
    return "Configuração de acesso indisponível no momento.";
  }

  return raw || "Não foi possível concluir a operação. Tente novamente.";
}

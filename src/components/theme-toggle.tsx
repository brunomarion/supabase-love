import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

const THEME_KEY = "ep.theme";

function applyTheme(theme: "light" | "dark") {
  document.documentElement.dataset.epTheme = theme;
  document.documentElement.style.colorScheme = theme;
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const saved = window.localStorage.getItem(THEME_KEY);
    const initial = saved === "dark" ? "dark" : "light";
    setTheme(initial);
    applyTheme(initial);
  }, []);

  function toggleTheme() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    window.localStorage.setItem(THEME_KEY, next);
    applyTheme(next);
  }

  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? "Ativar modo claro" : "Ativar modo noturno"}
      title={isDark ? "Modo claro" : "Modo noturno"}
      className="group relative flex h-10 w-[74px] items-center rounded-full border border-[#e2cfb1] bg-white/90 p-1 shadow-[0_8px_24px_rgba(64,48,30,0.12)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5 hover:border-[#cda96f] hover:shadow-[0_12px_30px_rgba(64,48,30,0.16)] active:translate-y-0"
    >
      <span
        className={"absolute top-1 flex size-8 items-center justify-center rounded-full shadow-[0_4px_12px_rgba(64,48,30,0.16)] transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] " + (isDark ? "left-[34px] bg-[#2f2a26] text-[#f4d18f]" : "left-1 bg-[#BA9051] text-white")}
      >
        {isDark ? <Moon className="size-4" strokeWidth={2} /> : <Sun className="size-4" strokeWidth={2} />}
      </span>
      <span className={"ml-1 flex w-8 justify-center text-[9px] font-bold uppercase tracking-[0.08em] transition-colors duration-300 " + (isDark ? "text-[#a79d94]" : "text-[#BA9051]")}>
        {isDark ? "Noite" : "Dia"}
      </span>
      <span className={"ml-auto mr-1 flex w-8 justify-center text-[9px] font-bold uppercase tracking-[0.08em] transition-colors duration-300 " + (isDark ? "text-[#f0c987]" : "text-[#9c9187]")}>
        {isDark ? "☾" : "☀"}
      </span>
    </button>
  );
}
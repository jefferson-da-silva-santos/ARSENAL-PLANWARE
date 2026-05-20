import { useEffect } from "react";
import AOS from "aos";

// ─────────────────────────────────────────────────────────────
//  useAOS
//  Inicializa o AOS na primeira montagem e chama AOS.refresh()
//  sempre que a rota mudar (pathname), garantindo que elementos
//  de novas telas também animem corretamente.
// ─────────────────────────────────────────────────────────────

interface UseAOSOptions {
  duration?: number;
  once?: boolean;
  offset?: number;
}

export function useAOS(options: UseAOSOptions = {}) {
  const { duration = 400, once = true, offset = 40 } = options;

  useEffect(() => {
    AOS.init({
      duration,
      once,
      offset,
      easing: "ease-out-cubic",
    });
  }, [duration, once, offset]);
}

// Hook simples para páginas — só faz refresh
export function useAOSRefresh(dep?: unknown) {
  useEffect(() => {
    // Pequeno delay para o DOM ter sido pintado antes do refresh
    const id = setTimeout(() => AOS.refresh(), 60);
    return () => clearTimeout(id);
  }, [dep]);
}

import { useState, useEffect } from "react";

// ─────────────────────────────────────────────────────────────
//  useDebounce
//  Retarda a atualização de um valor para evitar chamadas
//  de API a cada keystroke em campos de busca.
//
//  Uso:
//    const debouncedSearch = useDebounce(search, 350)
//    useEffect(() => { fetch(debouncedSearch) }, [debouncedSearch])
// ─────────────────────────────────────────────────────────────

export function useDebounce<T>(value: T, delay = 350): T {
  const [debounced, setDebounced] = useState<T>(value);

  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);

  return debounced;
}

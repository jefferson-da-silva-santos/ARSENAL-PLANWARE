import { useRef } from "react";
import { Notyf } from "notyf";

// ─────────────────────────────────────────────────────────────
//  useToast
//  Wrapper do Notyf com configuração do design system Navalha 22.
//  A instância é criada uma vez por componente via useRef.
// ─────────────────────────────────────────────────────────────

export function useToast() {
  const notyfRef = useRef<Notyf | null>(null);

  if (!notyfRef.current) {
    notyfRef.current = new Notyf({
      duration: 3500,
      position: { x: "right", y: "bottom" },
      ripple: false,
      dismissible: true,
      types: [
        {
          type: "success",
          background: "#2A1810", // --brown-600
          icon: {
            className: "bx bx-check-circle",
            tagName: "i",
            color: "#FF6B2C", // --orange-500
          },
        },
        {
          type: "error",
          background: "#C13838", // --danger
          icon: {
            className: "bx bx-error-circle",
            tagName: "i",
            color: "#fff",
          },
        },
        {
          type: "warning",
          background: "#C58524", // --warn
          icon: {
            className: "bx bx-error",
            tagName: "i",
            color: "#fff",
          },
        },
        {
          type: "info",
          background: "#2F6E9A", // --info
          icon: {
            className: "bx bx-info-circle",
            tagName: "i",
            color: "#fff",
          },
        },
      ],
    });
  }

  const notyf = notyfRef.current;

  return {
    success: (msg: string) => notyf.success(msg),
    error: (msg: string) => notyf.error(msg),
    warning: (msg: string) => notyf.open({ type: "warning", message: msg }),
    info: (msg: string) => notyf.open({ type: "info", message: msg }),
  };
}

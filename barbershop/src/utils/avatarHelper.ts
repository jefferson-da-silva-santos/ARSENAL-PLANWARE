// ─────────────────────────────────────────────────────────────
//  Avatar helper — Navalha 22 §5.7
//  Gradientes determinísticos por nome (5 variações)
//  Círculo com gradiente diagonal 135° em tons marrom/laranja
// ─────────────────────────────────────────────────────────────

const GRADIENTS = [
  "linear-gradient(135deg, #FFB088, #B83D0A)", // a
  "linear-gradient(135deg, #E4B98B, #5A3A22)", // b
  "linear-gradient(135deg, #C09866, #2A1810)", // c
  "linear-gradient(135deg, #FFA770, #8A6034)", // d
  "linear-gradient(135deg, #F4E9D8, #C09866)", // e
];

/**
 * Retorna o gradiente determinístico baseado no nome.
 * Sempre o mesmo gradiente para o mesmo nome.
 */
export function getAvatarGradient(name: string): string {
  const sum = Array.from(name).reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  return GRADIENTS[sum % GRADIENTS.length];
}

/**
 * Retorna as iniciais de um nome (máximo 2 letras).
 * "Marco Vinicius" → "MV"
 * "Felipe"         → "F"
 */
export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// ─────────────────────────────────────────────────────────────
//  Tamanhos de avatar (px)
// ─────────────────────────────────────────────────────────────

export const AVATAR_SIZES = {
  xs: 26,
  sm: 32,
  md: 40,
  lg: 56,
  xl: 80,
} as const;

export type AvatarSize = keyof typeof AVATAR_SIZES;

/**
 * Escapa caracteres HTML especiales para prevenir XSS.
 * Usar siempre que se interpole texto de usuario en strings HTML.
 */
export function esc(s: unknown): string {
  return String(s ?? "")
    .replace(/&/g,  "&amp;")
    .replace(/</g,  "&lt;")
    .replace(/>/g,  "&gt;")
    .replace(/"/g,  "&quot;")
    .replace(/'/g,  "&#x27;");
}

/**
 * Formatea un número como moneda hondureña. Ej: 1500.5 → "1,500.50"
 */
export function fmt(n: number): string {
  return Number(n || 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * Formatea número como moneda con prefijo L. Ej: 1500 → "L 1,500.00"
 */
export function fmtL(n: number): string {
  return "L " + fmt(n);
}

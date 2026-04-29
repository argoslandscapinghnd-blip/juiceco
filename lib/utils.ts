// Honduras siempre UTC-6, sin horario de verano
const TZ = "America/Tegucigalpa";

/** Fecha de hoy en Honduras como YYYY-MM-DD */
export function hoyHN(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: TZ });
}

/** Inicio del día (00:00:00 HN) como ISO UTC — para queries Supabase */
export function inicioDiaHN(fecha?: string): string {
  return new Date(`${fecha ?? hoyHN()}T00:00:00-06:00`).toISOString();
}

/** Fin del día (23:59:59 HN) como ISO UTC — para queries Supabase */
export function finDiaHN(fecha?: string): string {
  return new Date(`${fecha ?? hoyHN()}T23:59:59.999-06:00`).toISOString();
}

/** Fecha y hora actual formateada en zona horaria de Honduras */
export function ahoraHN(): string {
  return new Date().toLocaleString("es-HN", {
    timeZone: TZ,
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

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

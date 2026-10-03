import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Combina clases Tailwind de forma segura, resolviendo conflictos. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ─── Fechas ───────────────────────────────────────────────────────────────────

/** Devuelve una fecha como texto relativo al momento actual en español. */
export function formatRelative(dateString: string): string {
  const date     = new Date(dateString);
  const now      = new Date();
  const diffMs   = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60_000);
  const diffHrs  = Math.floor(diffMs / 3_600_000);
  const diffDays = Math.floor(diffMs / 86_400_000);

  if (diffMins  < 1)  return "justo ahora";
  if (diffMins  < 60) return `hace ${diffMins}m`;
  if (diffHrs   < 24) return `hace ${diffHrs}h`;
  if (diffDays === 1) return "ayer";
  if (diffDays  < 7)  return `hace ${diffDays} días`;

  return date.toLocaleDateString("es-AR", { day: "numeric", month: "short" });
}

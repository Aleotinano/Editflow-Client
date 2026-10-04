"use client";

import { useContext } from "react";
import { AuthContext } from "@/contexts/auth-context";

export type { CurrentUser } from "@/contexts/auth-context";

/** La sesión actual. Solo dentro de `AuthProvider` (lo monta `app/(app)/layout.tsx`). */
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de AuthProvider");
  return ctx;
}

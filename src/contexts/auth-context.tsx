"use client";

import { createContext, useCallback, useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { auth, ApiError, type Role } from "@/lib/api";

export interface CurrentUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  createdAt: string;
}

export interface AuthContextValue {
  user: CurrentUser | null;
  loading: boolean;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * La sesión del usuario, para todo el área autenticada.
 *
 * Antes el usuario y el token vivían en localStorage: cualquier XSS los leía, y el
 * token terminaba en la URL del streaming. Ahora la sesión es una cookie httpOnly que
 * el front no ve; para saber quién es el usuario se le pregunta a la API (`/auth/me`).
 * Si responde 401 (sin sesión, vencida, o usuario desactivado), se va al login.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    auth
      .me()
      .then((me) => {
        if (!cancelled) setUser(me);
      })
      .catch((err) => {
        if (cancelled) return;
        if (!(err instanceof ApiError) || err.status !== 401) {
          console.error("[auth] no se pudo leer la sesión", err);
        }
        router.replace("/login");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [router]);

  const logout = useCallback(async () => {
    // Aunque falle la red, el usuario quiere salir: se lo lleva al login igual.
    await auth.logout().catch(() => undefined);
    setUser(null);
    router.push("/login");
  }, [router]);

  return (
    <AuthContext.Provider value={{ user, loading, logout }}>{children}</AuthContext.Provider>
  );
}

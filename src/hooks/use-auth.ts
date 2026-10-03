"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Role } from "@/lib/api";

export interface CurrentUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  createdAt: string;
}

export function useAuth() {
  const router  = useRouter();
  const [user,    setUser]    = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const raw   = localStorage.getItem("user");

    if (!token || !raw) {
      router.replace("/login");
      return;
    }

    try {
      setUser(JSON.parse(raw) as CurrentUser);
    } catch {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      router.replace("/login");
    } finally {
      setLoading(false);
    }
  }, [router]);

  function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/login");
  }

  return { user, loading, logout };
}

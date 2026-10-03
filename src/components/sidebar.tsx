"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { patterns } from "@/lib/tokens";
import { cn } from "@/lib/utils";
import type { CurrentUser } from "@/hooks/use-auth";
import type { Role } from "@/lib/api";
import { useNotifications } from "@/contexts/notifications-context";

// ─── Icons ────────────────────────────────────────────────────────────────────

function VideoIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round"
        d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z" />
    </svg>
  );
}

function HomeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round"
        d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
    </svg>
  );
}

function FolderIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round"
        d="M2.25 12.75V12A2.25 2.25 0 0 1 4.5 9.75h15A2.25 2.25 0 0 1 21.75 12v.75m-8.69-6.44-2.12-2.12a1.5 1.5 0 0 0-1.061-.44H4.5A2.25 2.25 0 0 0 2.25 6v12a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9a2.25 2.25 0 0 0-2.25-2.25h-5.379a1.5 1.5 0 0 1-1.06-.44Z" />
    </svg>
  );
}

function UsersIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round"
        d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
    </svg>
  );
}

function UserIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round"
        d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
    </svg>
  );
}

function BellIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round"
        d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
    </svg>
  );
}

function ChartIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round"
        d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
    </svg>
  );
}

function PhoneIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round"
        d="M10.5 1.5H8.25A2.25 2.25 0 0 0 6 3.75v16.5a2.25 2.25 0 0 0 2.25 2.25h7.5A2.25 2.25 0 0 0 18 20.25V3.75a2.25 2.25 0 0 0-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" />
    </svg>
  );
}

function SunIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round"
        d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z" />
    </svg>
  );
}

function MoonIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round"
        d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z" />
    </svg>
  );
}

function LogOutIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round"
        d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15M12 9l-3 3m0 0 3 3m-3-3h12.75" />
    </svg>
  );
}

// ─── Navegación por rol ───────────────────────────────────────────────────────

type NavItem  = { label: string; href: string; icon: React.ComponentType<{ className?: string }> };
type NavGroup = { label?: string; items: NavItem[] };

const NAV: Record<Role, NavGroup[]> = {
  ADMIN: [
    {
      items: [
        { label: "Dashboard",  href: "/admin",          icon: HomeIcon   },
        { label: "Proyectos",  href: "/admin/projects", icon: FolderIcon },
        { label: "Tandas",     href: "/admin/quotas",   icon: ChartIcon  },
      ],
    },
    {
      label: "Gestión",
      items: [
        { label: "Clientes", href: "/admin/clients", icon: UsersIcon },
        { label: "Editores", href: "/admin/editors", icon: UserIcon  },
      ],
    },
    {
      items: [
        { label: "Notificaciones", href: "/admin/notifications", icon: BellIcon },
      ],
    },
  ],
  EDITOR: [
    {
      items: [
        { label: "Proyectos",      href: "/editor",              icon: FolderIcon },
        { label: "Multicuenta",    href: "/editor/multicuenta",  icon: PhoneIcon  },
        { label: "Notificaciones", href: "/editor/notifications", icon: BellIcon  },
      ],
    },
  ],
  CLIENT: [
    {
      items: [
        { label: "Mis proyectos",  href: "/client",               icon: FolderIcon },
        { label: "Notificaciones", href: "/client/notifications",  icon: BellIcon   },
      ],
    },
  ],
};

const ROLE_LABEL: Record<Role, string> = {
  ADMIN:  "Administrador",
  EDITOR: "Editor",
  CLIENT: "Cliente",
};

function getInitials(name: string) {
  return name.split(" ").slice(0, 2).map((p) => p[0]).join("").toUpperCase();
}

function isActive(href: string, pathname: string) {
  return pathname === href || (href.split("/").length > 2 && pathname.startsWith(href));
}

// ─── Sidebar ─────────────────────────────────────────────────────────────────

interface SidebarProps {
  user:     CurrentUser;
  onLogout: () => void;
}

export default function Sidebar({ user, onLogout }: SidebarProps) {
  const pathname           = usePathname();
  const groups             = NAV[user.role];
  const { unreadCount }    = useNotifications();
  const { resolvedTheme, setTheme } = useTheme();

  return (
    <aside className="w-[220px] h-full bg-surface-800 border-r border-white/[0.05] flex flex-col flex-shrink-0">

      {/* ── Logo ──────────────────────────────────────────────────────────── */}
      <div className="h-16 flex items-center px-4 flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-brand-500 rounded-lg flex items-center justify-center
            shadow-[0_0_18px_rgba(249,115,22,0.35)]">
            <VideoIcon className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="text-sm font-semibold text-ink-950 tracking-tight">EditFlow</span>
        </div>
      </div>

      {/* ── Navegación ────────────────────────────────────────────────────── */}
      <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-4">
        {groups.map((group, gi) => (
          <div key={gi}>
            {group.label && (
              <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-ink-300 px-3 mb-1.5">
                {group.label}
              </p>
            )}
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const active   = isActive(item.href, pathname);
                const isNotif  = item.href.endsWith("/notifications");
                const badge    = isNotif && unreadCount > 0 ? unreadCount : 0;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      active ? patterns.navItemActive : patterns.navItem,
                      "justify-between"
                    )}
                  >
                    <span className="flex items-center gap-2.5 min-w-0">
                      <item.icon className={cn(
                        "w-4 h-4 shrink-0",
                        active ? "text-brand-400" : "text-ink-500"
                      )} />
                      <span className="truncate">{item.label}</span>
                    </span>

                    {badge > 0 && (
                      <span className="ml-auto shrink-0 min-w-[18px] h-[18px] px-1 rounded-full
                        bg-brand-500 text-white text-[10px] font-semibold leading-none
                        flex items-center justify-center tabular-nums">
                        {badge > 99 ? "99+" : badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* ── Usuario ───────────────────────────────────────────────────────── */}
      <div className="px-3 py-4 border-t border-white/[0.05] flex-shrink-0 space-y-3">

        {/* Info */}
        <div className="flex items-center gap-2.5 px-1 min-w-0">
          <div className="w-7 h-7 rounded-full bg-brand-500/15 flex items-center justify-center shrink-0">
            <span className="text-[11px] font-semibold text-brand-400">
              {getInitials(user.name)}
            </span>
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-ink-950 truncate">{user.name}</p>
            <p className="text-[11px] text-ink-500">{ROLE_LABEL[user.role]}</p>
          </div>
        </div>

        {/* Acciones */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
            title={resolvedTheme === "dark" ? "Modo claro" : "Modo oscuro"}
            className={cn(patterns.btnGhost, "p-2 text-ink-500 hover:text-ink-950")}
          >
            {resolvedTheme === "dark"
              ? <SunIcon  className="w-3.5 h-3.5" />
              : <MoonIcon className="w-3.5 h-3.5" />
            }
          </button>

          <button
            onClick={onLogout}
            className={cn(
              patterns.btnGhost,
              "flex-1 justify-start text-xs text-ink-500 hover:text-error-400 gap-2 py-2 px-2"
            )}
          >
            <LogOutIcon className="w-3.5 h-3.5 shrink-0" />
            Cerrar sesión
          </button>
        </div>

      </div>
    </aside>
  );
}

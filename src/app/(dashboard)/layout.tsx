"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, GraduationCap, ListChecks, CalendarDays, LogOut, Brain } from "lucide-react";
import { theme } from "@/lib/theme/tokens";
import { t, type Lang } from "@/lib/i18n";
import { ApplicationsProvider, useApplications } from "@/lib/context/applications";
import { useAuth } from "@/hooks/useAuth";

const NAV = [
  { href: "/overview", icon: LayoutDashboard, key: "dashboard" as const },
  { href: "/schools", icon: GraduationCap, key: "schools" as const },
  { href: "/stages", icon: ListChecks, key: "stages" as const },
  { href: "/calendar", icon: CalendarDays, key: "calendar" as const },
  { href: "/vault", icon: Brain, key: "vault" as const },
];

function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { lang, setLang } = useApplications();
  const { user, signOut } = useAuth();

  const displayName = user?.user_metadata?.name || user?.email?.split("@")[0] || "User";
  const displayEmail = user?.email || "";
  const initials = displayName.slice(0, 1).toUpperCase();

  const handleSignOut = async () => {
    await signOut();
    router.push("/login");
  };

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside
        className="w-48 flex-shrink-0 flex flex-col border-r"
        style={{ background: theme.muted, borderColor: theme.border }}
      >
        {/* Logo */}
        <div className="px-4 py-5 border-b" style={{ borderColor: theme.border }}>
          <div className="text-lg font-semibold tracking-tight" style={{ fontFamily: "Georgia, serif", color: theme.text }}>
            ApplyWise
          </div>
          <div className="text-xs mt-0.5" style={{ color: theme.textMuted }}>
            25-26 cycle
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-2 py-3 space-y-0.5">
          {NAV.map((item) => {
            const active = pathname === item.href || pathname?.startsWith(item.href + "/");
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-2.5 px-3 py-2 rounded-md text-[13px] transition-all"
                style={{
                  color: active ? theme.text : theme.textSecondary,
                  fontWeight: active ? 600 : 400,
                  background: active ? theme.card : "transparent",
                  boxShadow: active ? `0 1px 3px ${theme.text}08` : "none",
                }}
              >
                <Icon size={16} strokeWidth={active ? 2 : 1.5} />
                {t(lang, item.key)}
              </Link>
            );
          })}
        </nav>

        {/* Language toggle */}
        <div className="px-4 py-3 border-t" style={{ borderColor: theme.border }}>
          <div
            className="flex rounded-md overflow-hidden border"
            style={{ background: theme.bg, borderColor: theme.border }}
          >
            {(["en", "zh"] as Lang[]).map((l) => (
              <button
                key={l}
                onClick={() => setLang(l)}
                className="flex-1 py-1 text-xs transition-all"
                style={{
                  fontWeight: lang === l ? 600 : 400,
                  background: lang === l ? theme.card : "transparent",
                  color: lang === l ? theme.text : theme.textMuted,
                }}
              >
                {l === "en" ? "EN" : "中"}
              </button>
            ))}
          </div>
        </div>

        {/* User */}
        <div className="px-4 py-3 border-t" style={{ borderColor: theme.border }}>
          <div className="flex items-center gap-2">
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold"
              style={{ background: theme.accentBg, color: theme.accent }}
            >
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium truncate" style={{ color: theme.text }}>
                {displayName}
              </div>
              <div className="text-[10px] truncate" style={{ color: theme.textMuted }}>
                {displayEmail}
              </div>
            </div>
            <button
              onClick={handleSignOut}
              title="Sign out"
              className="p-1 rounded-md transition-colors hover:opacity-70"
              style={{ color: theme.textMuted }}
            >
              <LogOut size={14} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto py-6 px-8 max-w-[880px]">
        {children}
      </main>
    </div>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <ApplicationsProvider>
      <DashboardShell>{children}</DashboardShell>
    </ApplicationsProvider>
  );
}

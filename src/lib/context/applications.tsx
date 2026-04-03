"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
  type ReactNode,
} from "react";
import type { Tier } from "@/lib/theme/tokens";
import type { ProgramResult, SchoolGroup } from "@/components/dashboard/SchoolSearch";
import { generateTasks, toggleTask as _toggleTask, type TasksState } from "@/lib/tasks";
import type { Lang } from "@/lib/i18n";

// ── Types ─────────────────────────────────────────────────

export interface AppProgram {
  id: string;
  schoolName: string;
  schoolNameZh: string;
  programName: string;
  programNameZh: string;
  degree: string;
  tier: Tier;
  deadline: string | null;
  portalUrl: string | null;
  programUrl: string | null;
  toeflMin: number | null;
  greRequired: boolean;
  applicationFee: number | null;
  tasksState: TasksState;
}

interface ApplicationsContextValue {
  apps: AppProgram[];
  lang: Lang;
  loaded: boolean;
  setLang: (lang: Lang) => void;
  addProgram: (progs: ProgramResult[], school: SchoolGroup) => void;
  removeApp: (id: string) => void;
  cycleTier: (id: string) => void;
  toggleTask: (appId: string, taskId: string) => void;
}

// ── Context ───────────────────────────────────────────────

const ApplicationsContext = createContext<ApplicationsContextValue | null>(null);

export function useApplications() {
  const ctx = useContext(ApplicationsContext);
  if (!ctx) throw new Error("useApplications must be used within ApplicationsProvider");
  return ctx;
}

// ── Persistence helpers ───────────────────────────────────

async function loadApps(): Promise<AppProgram[]> {
  try {
    const res = await fetch("/api/user-apps");
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

async function saveApps(apps: AppProgram[]): Promise<void> {
  try {
    await fetch("/api/user-apps", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(apps),
    });
  } catch (err) {
    console.error("Failed to save apps:", err);
  }
}

// ── Provider ──────────────────────────────────────────────

export function ApplicationsProvider({ children }: { children: ReactNode }) {
  const [apps, setApps] = useState<AppProgram[]>([]);
  const [lang, setLang] = useState<Lang>("en");
  const [loaded, setLoaded] = useState(false);

  // Track whether we've loaded from DB to avoid saving empty state on mount
  const hasLoaded = useRef(false);

  // Load apps from database on mount
  useEffect(() => {
    loadApps().then((saved) => {
      if (saved.length > 0) {
        setApps(saved);
      }
      hasLoaded.current = true;
      setLoaded(true);
    });
  }, []);

  // Save to database whenever apps change (after initial load)
  useEffect(() => {
    if (!hasLoaded.current) return;
    saveApps(apps);
  }, [apps]);

  const addProgram = useCallback((progs: ProgramResult[], school: SchoolGroup) => {
    setApps((prev) => {
      const next = [...prev];
      for (const p of progs) {
        if (next.some((a) => a.id === p.id)) continue;

        const tasksState = generateTasks({
          schoolName: school.schoolName,
          schoolNameZh: school.schoolNameZh,
          toeflCode: school.toeflCode ?? undefined,
          greCode: school.greCode ?? undefined,
          intlAdmissionsUrl: school.intlAdmissionsUrl ?? undefined,
          toeflMin: p.toeflMin,
          greRequired: p.greRequired,
          wesRequired: p.wesRequired,
          wesEvalType: p.wesEvalType,
          recsRequired: p.recsRequired,
          recsAcademicMin: p.recsAcademicMin,
          recsNotes: p.recsNotes ?? undefined,
          interviewReq: p.interviewReq,
          interviewFormat: p.interviewFormat ?? undefined,
          applicationFee: p.applicationFee,
          deadline: p.deadline,
          essays: p.essays,
          portalUrl: p.portalUrl,
          programUrl: p.programUrl,
          admissionsUrl: p.admissionsUrl,
        });

        next.push({
          id: p.id,
          schoolName: school.schoolName,
          schoolNameZh: school.schoolNameZh,
          programName: p.name,
          programNameZh: p.nameZh,
          degree: p.degree,
          tier: "target" as Tier,
          deadline: p.deadline,
          portalUrl: p.portalUrl,
          programUrl: p.programUrl,
          toeflMin: p.toeflMin,
          greRequired: p.greRequired,
          applicationFee: p.applicationFee,
          tasksState,
        });
      }
      return next;
    });
  }, []);

  const removeApp = useCallback((id: string) => {
    setApps((prev) => prev.filter((a) => a.id !== id));
  }, []);

  const cycleTier = useCallback((id: string) => {
    const order: Tier[] = ["reach", "target", "safe"];
    setApps((prev) =>
      prev.map((a) => {
        if (a.id !== id) return a;
        const idx = order.indexOf(a.tier);
        return { ...a, tier: order[(idx + 1) % 3] };
      })
    );
  }, []);

  const toggleTask = useCallback((appId: string, taskId: string) => {
    setApps((prev) =>
      prev.map((a) => {
        if (a.id !== appId) return a;
        return { ...a, tasksState: _toggleTask(a.tasksState, taskId) };
      })
    );
  }, []);

  return (
    <ApplicationsContext.Provider
      value={{ apps, lang, loaded, setLang, addProgram, removeApp, cycleTier, toggleTask }}
    >
      {children}
    </ApplicationsContext.Provider>
  );
}

"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Plus, ChevronRight, ExternalLink, Check } from "lucide-react";
import { theme, tierConfig } from "@/lib/theme/tokens";
import { useApplications } from "@/lib/context/applications";
import {
  PHASES,
  STAGES,
  stagesForPhase,
  tasksForStage,
  stageProgress,
  overallProgress,
  type StageDef,
  type PhaseDef,
} from "@/lib/tasks";

// ── Phase colors ──────────────────────────────────────────

const PHASE_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  pre_submit: { bg: "#EFF6FF", border: "#BFDBFE", text: "#1E40AF" },
  waiting:    { bg: "#FFF7ED", border: "#FED7AA", text: "#9A3412" },
  post_offer: { bg: "#ECFDF5", border: "#A7F3D0", text: "#065F46" },
  visa:       { bg: "#FDF2F8", border: "#FBCFE8", text: "#9D174D" },
};

// ── Stage category colors (matches screenshot) ────────────

function stageColor(stageId: string) {
  const map: Record<string, { bg: string; border: string }> = {
    wes:       { bg: "#EFF6FF", border: "#93C5FD" },  // blue — scores
    toefl:     { bg: "#EFF6FF", border: "#93C5FD" },
    gre:       { bg: "#EFF6FF", border: "#93C5FD" },
    essays:    { bg: "#FFF1F2", border: "#FECDD3" },  // rose — writing
    recs:      { bg: "#F3E8FF", border: "#D8B4FE" },  // purple — recs
    fees:      { bg: "#F0FDF4", border: "#BBF7D0" },  // green — forms
    interview: { bg: "#FFF7ED", border: "#FED7AA" },  // amber — waiting
    tracking:  { bg: "#FFF7ED", border: "#FED7AA" },
    confirm:   { bg: "#ECFDF5", border: "#6EE7B7" },  // teal — post-offer
    deposit:   { bg: "#ECFDF5", border: "#6EE7B7" },
    i20:       { bg: "#ECFDF5", border: "#6EE7B7" },
    visa:      { bg: "#FDF2F8", border: "#F9A8D4" },  // pink — visa
    predeparture: { bg: "#FDF2F8", border: "#F9A8D4" },
  };
  return map[stageId] ?? { bg: theme.muted, border: theme.border };
}

export default function OverviewPage() {
  const { apps, lang } = useApplications();

  if (apps.length === 0) {
    return (
      <div>
        <PageHeader lang={lang} />
        <EmptyState lang={lang} />
      </div>
    );
  }

  // Overall progress
  const totals = apps.reduce(
    (acc, app) => {
      const p = overallProgress(app.tasksState);
      return { done: acc.done + p.done, total: acc.total + p.total };
    },
    { done: 0, total: 0 }
  );

  return (
    <div>
      <PageHeader lang={lang} />

      {/* Overall summary bar */}
      <div
        className="rounded-lg border px-5 py-4 mb-6 flex items-center gap-4"
        style={{ background: theme.card, borderColor: theme.border }}
      >
        <div className="flex-1">
          <div className="text-xs font-medium mb-1.5" style={{ color: theme.textSecondary }}>
            {lang === "zh" ? "整体进度" : "Overall progress"}
          </div>
          <div className="h-2 rounded-full overflow-hidden" style={{ background: theme.muted }}>
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${totals.total > 0 ? (totals.done / totals.total) * 100 : 0}%`,
                background: theme.accent,
              }}
            />
          </div>
        </div>
        <div className="text-right">
          <div className="text-lg font-semibold" style={{ color: theme.text, fontFamily: "Georgia, serif" }}>
            {totals.done}/{totals.total}
          </div>
          <div className="text-[10px]" style={{ color: theme.textMuted }}>
            {lang === "zh" ? "项任务" : "tasks"}
          </div>
        </div>
        <div className="text-right">
          <div className="text-lg font-semibold" style={{ color: theme.text, fontFamily: "Georgia, serif" }}>
            {apps.length}
          </div>
          <div className="text-[10px]" style={{ color: theme.textMuted }}>
            {lang === "zh" ? "所学校" : apps.length === 1 ? "school" : "schools"}
          </div>
        </div>
      </div>

      {/* Flow chart */}
      <div className="space-y-4">
        {PHASES.map((phase, phaseIdx) => (
          <PhaseRow key={phase.id} phase={phase} lang={lang} showArrow={phaseIdx < PHASES.length - 1} />
        ))}
      </div>
    </div>
  );
}

// ── Page header ───────────────────────────────────────────

function PageHeader({ lang }: { lang: string }) {
  return (
    <div className="mb-5">
      <div className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: theme.textMuted }}>
        {lang === "zh" ? "总览" : "Overview"}
      </div>
      <div className="text-2xl font-semibold mt-0.5 tracking-tight" style={{ fontFamily: "Georgia, serif", color: theme.text }}>
        {lang === "zh" ? "申请进度" : "Application progress"}
      </div>
    </div>
  );
}

// ── Empty state ───────────────────────────────────────────

function EmptyState({ lang }: { lang: string }) {
  return (
    <div className="text-center py-16 rounded-xl border border-dashed" style={{ borderColor: theme.border }}>
      <div className="text-sm mb-3" style={{ color: theme.textSecondary }}>
        {lang === "zh" ? "添加学校后，这里会显示你的申请进度全景图。" : "Add schools to see your full application progress map."}
      </div>
      <Link href="/schools" className="text-sm font-medium px-5 py-2.5 rounded-lg inline-block"
        style={{ background: theme.accent, color: "#fff" }}>
        <Plus size={14} className="inline -mt-px mr-1" />
        {lang === "zh" ? "添加学校" : "Add schools"}
      </Link>
    </div>
  );
}

// ── Phase row ─────────────────────────────────────────────

function PhaseRow({ phase, lang, showArrow }: { phase: PhaseDef; lang: string; showArrow: boolean }) {
  const { apps } = useApplications();
  const stages = stagesForPhase(phase.id);
  const pc = PHASE_COLORS[phase.id];

  // Check if any stages in this phase have tasks
  const hasContent = stages.some((stage) =>
    apps.some((app) => tasksForStage(app.tasksState, stage.id).length > 0)
  );

  return (
    <div>
      {/* Phase label */}
      <div className="flex items-center gap-2 mb-2">
        <div
          className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded"
          style={{ color: pc.text, background: pc.bg }}
        >
          {lang === "zh" ? phase.titleZh : phase.title}
        </div>
        <div className="flex-1 h-px" style={{ background: theme.border }} />
      </div>

      {/* Stage cards grid */}
      <div className="flex flex-wrap gap-2">
        {stages.map((stage) => (
          <StageNode key={stage.id} stage={stage} lang={lang} />
        ))}
      </div>

      {/* Arrow to next phase */}
      {showArrow && (
        <div className="flex justify-center py-2">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M12 4v14M7 13l5 5 5-5" stroke={theme.border} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      )}
    </div>
  );
}

// ── Stage node (card with hover tooltip) ──────────────────

function StageNode({ stage, lang }: { stage: StageDef; lang: string }) {
  const { apps, toggleTask } = useApplications();
  const [hovered, setHovered] = useState(false);
  const [tooltipPos, setTooltipPos] = useState<"below" | "above">("below");
  const nodeRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const colors = stageColor(stage.id);

  // Aggregate progress across all apps
  let totalDone = 0;
  let totalRequired = 0;
  const appDetails: {
    app: (typeof apps)[number];
    tasks: ReturnType<typeof tasksForStage>;
    done: number;
    total: number;
  }[] = [];

  for (const app of apps) {
    const tasks = tasksForStage(app.tasksState, stage.id);
    const required = tasks.filter((t) => t.required);
    if (required.length === 0) continue;
    const done = required.filter((t) => t.completed).length;
    totalDone += done;
    totalRequired += required.length;
    appDetails.push({ app, tasks, done, total: required.length });
  }

  // Don't render if no apps have tasks for this stage
  if (appDetails.length === 0) return null;

  const allDone = totalRequired > 0 && totalDone === totalRequired;
  const hasProgress = totalDone > 0;

  // Determine tooltip position
  useEffect(() => {
    if (hovered && nodeRef.current) {
      const rect = nodeRef.current.getBoundingClientRect();
      setTooltipPos(rect.bottom + 300 > window.innerHeight ? "above" : "below");
    }
  }, [hovered]);

  return (
    <div
      ref={nodeRef}
      className="relative"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Stage card */}
      <button
        onClick={() => router.push("/stages")}
        className="rounded-lg border-2 px-4 py-3 text-left transition-all hover:shadow-md min-w-[140px]"
        style={{
          background: colors.bg,
          borderColor: allDone ? theme.accent : colors.border,
          opacity: stage.conditional && totalRequired === 0 ? 0.4 : 1,
        }}
      >
        {/* Title */}
        <div className="text-xs font-semibold mb-1" style={{ color: allDone ? theme.accent : theme.text }}>
          {allDone && <Check size={12} className="inline -mt-px mr-0.5" />}
          {lang === "zh" ? stage.titleZh : stage.title}
        </div>

        {/* Progress bar */}
        {totalRequired > 0 && (
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: colors.border }}>
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${(totalDone / totalRequired) * 100}%`,
                  background: allDone ? theme.accent : theme.text,
                }}
              />
            </div>
            <span className="text-[10px] font-medium" style={{ color: theme.textMuted }}>
              {totalDone}/{totalRequired}
            </span>
          </div>
        )}
      </button>

      {/* Hover tooltip — per-school progress */}
      {hovered && appDetails.length > 0 && (
        <div
          className="absolute z-50 w-72 rounded-lg border shadow-lg p-3 animate-in fade-in duration-150"
          style={{
            background: theme.card,
            borderColor: theme.border,
            left: "50%",
            transform: "translateX(-50%)",
            ...(tooltipPos === "below" ? { top: "calc(100% + 8px)" } : { bottom: "calc(100% + 8px)" }),
          }}
        >
          {/* Stage description */}
          <div className="text-[11px] mb-2 pb-2 border-b" style={{ color: theme.textSecondary, borderColor: theme.border }}>
            {lang === "zh" ? stage.descriptionZh : stage.description}
          </div>

          {/* Per-school breakdown */}
          <div className="space-y-2.5">
            {appDetails.map(({ app, tasks, done, total }) => (
              <div key={app.id}>
                {/* School header */}
                <div className="flex items-center gap-1.5 mb-1">
                  <span
                    className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                    style={{ background: tierConfig[app.tier].bar }}
                  />
                  <span className="text-[11px] font-semibold truncate" style={{ color: theme.text }}>
                    {lang === "zh" ? app.schoolNameZh : app.schoolName}
                  </span>
                  <span className="text-[10px] ml-auto flex-shrink-0" style={{ color: theme.textMuted }}>
                    {done}/{total}
                  </span>
                </div>

                {/* Task list */}
                <div className="space-y-0.5 pl-3">
                  {tasks.filter((t) => t.required).map((task) => (
                    <div key={task.id} className="flex items-center gap-1.5">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleTask(app.id, task.id);
                        }}
                        className="w-3 h-3 rounded-sm flex-shrink-0 flex items-center justify-center border transition-all"
                        style={{
                          borderColor: task.completed ? theme.accent : theme.borderHover,
                          background: task.completed ? theme.accent : "transparent",
                        }}
                      >
                        {task.completed && <Check size={7} color="#fff" strokeWidth={3} />}
                      </button>
                      <span
                        className="text-[10px] truncate"
                        style={{
                          color: task.completed ? theme.textMuted : theme.text,
                          textDecoration: task.completed ? "line-through" : "none",
                        }}
                      >
                        {lang === "zh" ? task.titleZh : task.title}
                      </span>
                      {task.dueDate && (
                        <span className="text-[9px] ml-auto flex-shrink-0" style={{ color: theme.textMuted }}>
                          {new Date(task.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Footer link */}
          <div className="mt-2 pt-2 border-t" style={{ borderColor: theme.border }}>
            <button
              onClick={() => router.push("/stages")}
              className="text-[10px] font-medium flex items-center gap-1"
              style={{ color: theme.accent }}
            >
              {lang === "zh" ? "查看详情" : "View details"}
              <ChevronRight size={10} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

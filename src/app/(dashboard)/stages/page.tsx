"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, ExternalLink, Check } from "lucide-react";
import Link from "next/link";
import { theme, tierConfig } from "@/lib/theme/tokens";
import { useApplications } from "@/lib/context/applications";
import {
  PHASES,
  STAGES,
  stagesForPhase,
  tasksForStage,
  stageProgress,
  type Task,
  type StageDef,
} from "@/lib/tasks";

export default function StagesPage() {
  const { apps, lang, toggleTask } = useApplications();

  if (apps.length === 0) {
    return (
      <div>
        <PageHeader lang={lang} />
        <div
          className="text-center py-16 rounded-xl border border-dashed"
          style={{ borderColor: theme.border }}
        >
          <div className="text-sm mb-3" style={{ color: theme.textSecondary }}>
            {lang === "zh"
              ? "先添加学校，然后在这里管理申请阶段。"
              : "Add schools first, then manage your application stages here."}
          </div>
          <Link
            href="/schools"
            className="text-sm font-medium px-5 py-2.5 rounded-lg inline-block"
            style={{ background: theme.accent, color: "#fff" }}
          >
            {lang === "zh" ? "去添加学校" : "Go to Schools"}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader lang={lang} />
      <div className="space-y-6">
        {PHASES.map((phase) => (
          <PhaseSection key={phase.id} phase={phase} lang={lang} />
        ))}
      </div>
    </div>
  );
}

// ── Page header ───────────────────────────────────────────

function PageHeader({ lang }: { lang: string }) {
  return (
    <div className="mb-5">
      <div
        className="text-[11px] font-semibold uppercase tracking-widest"
        style={{ color: theme.textMuted }}
      >
        {lang === "zh" ? "按阶段管理" : "Manage by stage"}
      </div>
      <div
        className="text-2xl font-semibold mt-0.5 tracking-tight"
        style={{ fontFamily: "Georgia, serif", color: theme.text }}
      >
        {lang === "zh" ? "申请阶段" : "Stages"}
      </div>
    </div>
  );
}

// ── Phase section ─────────────────────────────────────────

function PhaseSection({
  phase,
  lang,
}: {
  phase: (typeof PHASES)[number];
  lang: string;
}) {
  const { apps } = useApplications();
  const stages = stagesForPhase(phase.id);

  // Calculate aggregate progress for the phase
  let phaseDone = 0;
  let phaseTotal = 0;
  for (const app of apps) {
    for (const stage of stages) {
      const p = stageProgress(app.tasksState, stage.id);
      phaseDone += p.done;
      phaseTotal += p.total;
    }
  }

  return (
    <div>
      {/* Phase header */}
      <div className="flex items-center gap-3 mb-3">
        <div
          className="text-xs font-semibold uppercase tracking-wider"
          style={{ color: theme.textSecondary }}
        >
          {lang === "zh" ? phase.titleZh : phase.title}
        </div>
        <div className="flex-1 h-px" style={{ background: theme.border }} />
        {phaseTotal > 0 && (
          <div className="text-[11px]" style={{ color: theme.textMuted }}>
            {phaseDone}/{phaseTotal}
          </div>
        )}
      </div>

      {/* Stages within this phase */}
      <div className="space-y-2">
        {stages.map((stage) => (
          <StageCard key={stage.id} stage={stage} lang={lang} />
        ))}
      </div>
    </div>
  );
}

// ── Stage card (collapsible) ──────────────────────────────

function StageCard({ stage, lang }: { stage: StageDef; lang: string }) {
  const { apps, toggleTask } = useApplications();
  const [expanded, setExpanded] = useState(false);

  // Collect tasks per app for this stage
  const appTasks: { app: (typeof apps)[number]; tasks: Task[] }[] = [];
  for (const app of apps) {
    const tasks = tasksForStage(app.tasksState, stage.id);
    if (tasks.length > 0) appTasks.push({ app, tasks });
  }

  // If no apps have tasks for this stage, show nothing
  if (appTasks.length === 0) return null;

  // Aggregate progress
  let totalDone = 0;
  let totalRequired = 0;
  for (const { tasks } of appTasks) {
    for (const t of tasks) {
      if (t.required) {
        totalRequired++;
        if (t.completed) totalDone++;
      }
    }
  }

  const allDone = totalRequired > 0 && totalDone === totalRequired;
  const hasProgress = totalDone > 0;

  return (
    <div
      className="rounded-lg border overflow-hidden"
      style={{
        borderColor: allDone ? theme.accent + "40" : theme.border,
        background: theme.card,
      }}
    >
      {/* Stage header — clickable to expand */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left transition-colors"
        style={{ background: expanded ? theme.muted : "transparent" }}
      >
        {/* Expand icon */}
        {expanded ? (
          <ChevronDown size={14} style={{ color: theme.textMuted }} />
        ) : (
          <ChevronRight size={14} style={{ color: theme.textMuted }} />
        )}

        {/* Stage title */}
        <div className="flex-1 min-w-0">
          <div className="text-[13px] font-medium" style={{ color: theme.text }}>
            {lang === "zh" ? stage.titleZh : stage.title}
          </div>
          <div className="text-[11px] mt-0.5" style={{ color: theme.textMuted }}>
            {lang === "zh" ? stage.descriptionZh : stage.description}
          </div>
        </div>

        {/* Progress pill */}
        {totalRequired > 0 && (
          <div
            className="text-[11px] font-medium px-2 py-0.5 rounded-full flex-shrink-0"
            style={{
              background: allDone ? theme.accent + "18" : theme.muted,
              color: allDone ? theme.accent : theme.textSecondary,
            }}
          >
            {totalDone}/{totalRequired}
          </div>
        )}
      </button>

      {/* Expanded: tasks per school */}
      {expanded && (
        <div className="border-t" style={{ borderColor: theme.border }}>
          {appTasks.map(({ app, tasks }) => (
            <div
              key={app.id}
              className="px-4 py-3 border-b last:border-b-0"
              style={{ borderColor: theme.border + "80" }}
            >
              {/* School label */}
              <div className="flex items-center gap-2 mb-2">
                <span
                  className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                  style={{ background: tierConfig[app.tier].bar }}
                />
                <span className="text-[11px] font-semibold" style={{ color: theme.textSecondary }}>
                  {lang === "zh" ? app.schoolNameZh : app.schoolName}
                </span>
                <span className="text-[10px]" style={{ color: theme.textMuted }}>
                  {lang === "zh" ? app.programNameZh : app.programName}
                </span>
              </div>

              {/* Task checkboxes */}
              <div className="space-y-1.5 pl-3.5">
                {tasks.map((task) => (
                  <TaskRow
                    key={task.id}
                    task={task}
                    lang={lang}
                    onToggle={() => toggleTask(app.id, task.id)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Single task row ───────────────────────────────────────

function TaskRow({
  task,
  lang,
  onToggle,
}: {
  task: Task;
  lang: string;
  onToggle: () => void;
}) {
  return (
    <div
      className="flex items-start gap-2 group"
      style={{ opacity: task.required ? 1 : 0.5 }}
    >
      {/* Checkbox */}
      <button
        onClick={onToggle}
        className="w-4 h-4 mt-0.5 rounded flex-shrink-0 flex items-center justify-center transition-all border"
        style={{
          borderColor: task.completed ? theme.accent : theme.borderHover,
          background: task.completed ? theme.accent : "transparent",
        }}
      >
        {task.completed && <Check size={10} color="#fff" strokeWidth={2.5} />}
      </button>

      {/* Task text */}
      <div className="flex-1 min-w-0">
        <span
          className="text-xs"
          style={{
            color: task.completed ? theme.textMuted : theme.text,
            textDecoration: task.completed ? "line-through" : "none",
          }}
        >
          {lang === "zh" ? task.titleZh : task.title}
        </span>
        {!task.required && (
          <span
            className="text-[9px] ml-1.5 px-1 py-px rounded"
            style={{ background: theme.muted, color: theme.textMuted }}
          >
            {lang === "zh" ? "选填" : "optional"}
          </span>
        )}
      </div>

      {/* Due date */}
      {task.dueDate && (
        <span className="text-[10px] flex-shrink-0" style={{ color: theme.textMuted }}>
          {new Date(task.dueDate).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          })}
        </span>
      )}

      {/* External link */}
      {task.url && (
        <a
          href={task.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
          style={{ color: theme.textMuted }}
          onClick={(e) => e.stopPropagation()}
        >
          <ExternalLink size={10} />
        </a>
      )}
    </div>
  );
}

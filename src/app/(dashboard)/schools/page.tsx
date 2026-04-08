"use client";

import { useState } from "react";
import { Plus, X, CheckCircle2, AlertTriangle, ExternalLink } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { theme, tierConfig, type Tier } from "@/lib/theme/tokens";
import SchoolSearch from "@/components/dashboard/SchoolSearch";
import SmartExtract from "@/components/dashboard/SmartExtract";
import "@/components/dashboard/SmartExtract.css";
import { extractedToProgram } from "@/lib/extract/bridge";
import { generateTasks } from "@/lib/tasks";
import { useApplications, type AppProgram } from "@/lib/context/applications";
import { overallProgress } from "@/lib/tasks";

export default function SchoolsPage() {
  const { apps, lang, addProgram, addRawApp, cycleTier, removeApp } = useApplications();
  const [showSearch, setShowSearch] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<AppProgram | null>(null);
  const router = useRouter();

  const existingIds = new Set(apps.map((a) => a.id));

  if (showSearch) {
    return (
      <div>
        <div className="flex justify-between items-end mb-4">
          <div>
            <div
              className="text-[11px] font-semibold uppercase tracking-widest"
              style={{ color: theme.textMuted }}
            >
              {lang === "zh" ? "选校" : "Schools"}
            </div>
            <div
              className="text-2xl font-semibold mt-0.5 tracking-tight"
              style={{ fontFamily: "Georgia, serif", color: theme.text }}
            >
              {lang === "zh" ? "添加学校" : "Add a school"}
            </div>
          </div>
          <button
            onClick={() => setShowSearch(false)}
            className="text-xs px-3 py-1.5 rounded-md border transition-colors"
            style={{ borderColor: theme.border, color: theme.textSecondary }}
          >
            {lang === "zh" ? "返回" : "Back"}
          </button>
        </div>
        <SmartExtract
          lang={lang}
          onProgramExtracted={(extracted) => {
            const program = extractedToProgram(extracted);
            const tasksState = generateTasks({
              schoolName: program.schoolName,
              schoolNameZh: program.schoolNameZh,
              toeflMin: program.toeflMin ?? null,
              greRequired: program.greRequired,
              wesRequired: program.wesRequired ?? false,
              wesEvalType: program.wesEvalType,
              recsRequired: program.recsRequired ?? 3,
              recsAcademicMin: program.recsAcademicMin,
              interviewReq: program.interviewRequired ?? false,
              interviewFormat: program.interviewFormat,
              applicationFee: program.applicationFee ?? null,
              deadline: program.deadlineRegular || program.deadlineFinal || null,
              essays: program.essayPrompts?.map(e => ({
                title: e.prompt.slice(0, 60),
                title_zh: e.prompt.slice(0, 60),
                word_limit: e.wordLimit ?? null,
                prompt: e.prompt,
                type: e.type,
              })) || null,
              portalUrl: program.portalUrl ?? null,
              programUrl: program.programUrl,
              admissionsUrl: program.admissionsUrl,
            });
            // Directly add to apps via the raw setter
            const newApp = {
              id: program.id,
              schoolName: program.schoolName,
              schoolNameZh: program.schoolNameZh || program.schoolName,
              programName: program.name,
              programNameZh: program.nameZh || program.name,
              degree: program.degree,
              tier: "target" as const,
              deadline: program.deadlineRegular || program.deadlineFinal || null,
              portalUrl: program.portalUrl ?? null,
              programUrl: program.programUrl,
              toeflMin: program.toeflMin ?? null,
              greRequired: program.greRequired,
              applicationFee: program.applicationFee ?? null,
              tasksState,
            };
            // Use addExtractedProgram if available, otherwise we need to expose it
            addRawApp(newApp);
            setShowSearch(false);
          }}
        />

        <div style={{ margin: "20px 0 12px", display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ flex: 1, height: 1, background: "#DDE3DB" }} />
          <span style={{ fontSize: 12, color: "#A3AEA3" }}>{lang === "zh" ? "或从已有数据搜索" : "or search existing database"}</span>
          <div style={{ flex: 1, height: 1, background: "#DDE3DB" }} />
        </div>

        <SchoolSearch
          lang={lang}
          existingProgramIds={existingIds}
          onSelect={addProgram}
          mode="add"
        />
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-end mb-5">
        <div>
          <div
            className="text-[11px] font-semibold uppercase tracking-widest"
            style={{ color: theme.textMuted }}
          >
            {lang === "zh" ? "选校" : "Schools"}
          </div>
          <div
            className="text-2xl font-semibold mt-0.5 tracking-tight"
            style={{ fontFamily: "Georgia, serif", color: theme.text }}
          >
            {lang === "zh" ? "我的学校" : "My schools"}
          </div>
        </div>
        <button
          onClick={() => setShowSearch(true)}
          className="text-xs font-medium px-4 py-2 rounded-lg transition-colors"
          style={{ background: theme.buttonBg, color: theme.buttonFg }}
        >
          <Plus size={14} className="inline -mt-px mr-1" />
          {lang === "zh" ? "添加学校" : "Add school"}
        </button>
      </div>

      {apps.length === 0 && (
        <div className="text-center py-16">
          <div className="text-sm mb-3" style={{ color: theme.textMuted }}>
            {lang === "zh" ? "还没有添加学校" : "No schools added yet"}
          </div>
          <button
            onClick={() => setShowSearch(true)}
            className="text-sm font-medium px-5 py-2.5 rounded-lg"
            style={{ background: theme.accent, color: "#fff" }}
          >
            <Plus size={14} className="inline -mt-px mr-1" />
            {lang === "zh" ? "添加学校" : "Add your first school"}
          </button>
        </div>
      )}

      {/* Grouped by tier */}
      {(["reach", "target", "safe"] as Tier[]).map((tier) => {
        const list = apps.filter((a) => a.tier === tier);
        if (!list.length) return null;

        return (
          <div key={tier} className="mb-6">
            <div className="flex items-center gap-2 mb-2">
              <span
                className="text-[10px] font-semibold px-2 py-0.5 rounded uppercase tracking-wider"
                style={{
                  color: tierConfig[tier].fg,
                  background: tierConfig[tier].bg,
                }}
              >
                {lang === "zh" ? tierConfig[tier].zh : tierConfig[tier].en}
              </span>
              <span className="text-xs" style={{ color: theme.textMuted }}>
                {list.length}
              </span>
            </div>

            <div className="flex flex-col gap-2">
              {list.map((app) => {
                const progress = overallProgress(app.tasksState);

                return (
                  <div
                    key={app.id}
                    className="flex items-stretch rounded-[10px] overflow-hidden border transition-all hover:shadow-sm hover:-translate-y-px cursor-pointer"
                    onClick={() => router.push(`/schools/${app.id}`)}
                    style={{ background: theme.card, borderColor: theme.border }}
                  >
                    {/* Tier color bar */}
                    <div
                      className="w-1 flex-shrink-0"
                      style={{ background: tierConfig[app.tier].bar }}
                    />

                    <div className="flex-1 px-4 py-3 flex items-center gap-3">
                      {/* School + program info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold" style={{ color: theme.text }}>
                            {lang === "zh" ? app.schoolNameZh : app.schoolName}
                          </span>
                          <span className="text-xs" style={{ color: theme.textMuted }}>
                            {lang === "zh" ? app.schoolName : app.schoolNameZh}
                          </span>
                        </div>
                        <div className="text-xs mt-0.5 flex items-center gap-2" style={{ color: theme.textSecondary }}>
                          <span>{lang === "zh" ? app.programNameZh : app.programName}</span>
                          <span
                            className="inline-flex items-center gap-0.5 text-[10px]"
                            style={{ color: theme.textMuted }}
                          >
                            <CheckCircle2 size={10} />
                            {progress.done}/{progress.total}
                          </span>
                          {/* Source badge */}
                          {app.programUrl && (
                            <a
                              href={app.programUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-0.5 text-[10px] px-1.5 py-px rounded hover:underline"
                              style={{ color: theme.accent, background: theme.accentBg }}
                              onClick={(e) => e.stopPropagation()}
                              title={app.programUrl}
                            >
                              <ExternalLink size={8} />
                              .edu
                            </a>
                          )}
                        </div>
                      </div>

                      {/* Deadline */}
                      {app.deadline && (
                        <div className="text-xs text-right min-w-[60px]" style={{ color: theme.textSecondary }}>
                          {new Date(app.deadline).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          })}
                        </div>
                      )}

                      {/* Tier badge */}
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          cycleTier(app.id);
                        }}
                        className="text-[10px] font-semibold px-2 py-0.5 rounded uppercase tracking-wider transition-colors"
                        style={{
                          color: tierConfig[app.tier].fg,
                          background: tierConfig[app.tier].bg,
                        }}
                        title="Click to change tier"
                      >
                        {lang === "zh" ? tierConfig[app.tier].zh : tierConfig[app.tier].en}
                      </button>

                      {/* Remove — opens confirmation */}
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          setDeleteTarget(app);
                        }}
                        className="text-base leading-none p-1 transition-colors"
                        style={{ color: theme.textMuted }}
                        title="Remove"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Delete confirmation modal */}
      {deleteTarget && (
        <DeleteModal
          app={deleteTarget}
          lang={lang}
          onConfirm={() => {
            removeApp(deleteTarget.id);
            setDeleteTarget(null);
          }}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}

// ── Delete confirmation modal ─────────────────────────────

function DeleteModal({
  app,
  lang,
  onConfirm,
  onCancel,
}: {
  app: AppProgram;
  lang: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const progress = overallProgress(app.tasksState);
  const hasProgress = progress.done > 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.3)" }}
      onClick={onCancel}
    >
      <div
        className="rounded-xl border shadow-lg max-w-sm w-full mx-4 p-5"
        style={{ background: theme.card, borderColor: theme.border }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3 mb-3">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
            style={{ background: "#FEF2F2" }}
          >
            <AlertTriangle size={16} color="#DC2626" />
          </div>
          <div>
            <div className="text-sm font-semibold" style={{ color: theme.text }}>
              {lang === "zh" ? "确认移除" : "Remove school?"}
            </div>
            <div className="text-xs mt-1" style={{ color: theme.textSecondary }}>
              {lang === "zh" ? app.schoolNameZh : app.schoolName}
              {" — "}
              {lang === "zh" ? app.programNameZh : app.programName}
            </div>
          </div>
        </div>

        {hasProgress && (
          <div
            className="text-xs rounded-md px-3 py-2 mb-3"
            style={{ background: theme.muted, color: theme.textSecondary }}
          >
            {lang === "zh"
              ? `你已完成了 ${progress.done}/${progress.total} 项任务。移除后任务进度将丢失。`
              : `You've completed ${progress.done} of ${progress.total} tasks. Removing will lose this progress.`}
          </div>
        )}

        <div className="flex justify-end gap-2 mt-4">
          <button
            onClick={onCancel}
            className="text-xs px-4 py-2 rounded-lg border transition-colors"
            style={{ borderColor: theme.border, color: theme.textSecondary }}
          >
            {lang === "zh" ? "取消" : "Cancel"}
          </button>
          <button
            onClick={onConfirm}
            className="text-xs font-medium px-4 py-2 rounded-lg transition-colors"
            style={{ background: "#DC2626", color: "#fff" }}
          >
            {lang === "zh" ? "确认移除" : "Remove"}
          </button>
        </div>
      </div>
    </div>
  );
}

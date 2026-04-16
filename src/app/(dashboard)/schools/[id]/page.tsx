"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useMemo } from "react";
import {
  ArrowLeft,
  ExternalLink,
  Clock,
  CheckCircle2,
  Circle,
  ChevronDown,
  ChevronRight,
  FileText,
  AlertTriangle,
  Globe,
} from "lucide-react";
import { useApplications, type AppProgram } from "@/lib/context/applications";
import { theme, tierConfig, type Tier } from "@/lib/theme/tokens";
import { t, type Lang } from "@/lib/i18n";
import { PHASES, STAGES, stagesForPhase } from "@/lib/tasks/stages";
import { tasksForStage, stageProgress, overallProgress, type Task } from "@/lib/tasks";

// ── Tab types ──

type TabId = "tasks" | "requirements" | "essays" | "notes";

const TAB_LABELS: Record<TabId, { en: string; zh: string }> = {
  tasks:        { en: "Tasks",        zh: "任务" },
  requirements: { en: "Requirements", zh: "申请要求" },
  essays:       { en: "Essays",       zh: "文书" },
  notes:        { en: "Notes",        zh: "笔记" },
};

// ── Main Page ──

export default function ProgramDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { apps, lang, toggleTask, cycleTier } = useApplications();

  const app = apps.find((a) => a.id === params.id);
  if (!app) {
    return (
      <div style={{ padding: 40, textAlign: "center", color: theme.textMuted }}>
        <p>{lang === "zh" ? "未找到该项目" : "Program not found"}</p>
        <button
          onClick={() => router.push("/schools")}
          style={{ marginTop: 12, color: theme.accent, background: "none", border: "none", cursor: "pointer" }}
        >
          ← {t(lang, "back")}
        </button>
      </div>
    );
  }

  return <ProgramDetail app={app} lang={lang} toggleTask={toggleTask} cycleTier={cycleTier} router={router} />;
}

// ── Detail Component ──

function ProgramDetail({
  app,
  lang,
  toggleTask,
  cycleTier,
  router,
}: {
  app: AppProgram;
  lang: Lang;
  toggleTask: (appId: string, taskId: string) => void;
  cycleTier: (id: string) => void;
  router: ReturnType<typeof useRouter>;
}) {
  const [activeTab, setActiveTab] = useState<TabId>("tasks");
  const [expandedStages, setExpandedStages] = useState<Set<string>>(new Set(["toefl", "essays", "recs", "fees"]));

  const progress = overallProgress(app.tasksState);
  const progressPct = progress.total > 0 ? Math.round((progress.done / progress.total) * 100) : 0;

  const daysLeft = useMemo(() => {
    if (!app.deadline) return null;
    const diff = Math.ceil((new Date(app.deadline).getTime() - Date.now()) / 86400000);
    return diff;
  }, [app.deadline]);

  const tier = tierConfig[app.tier];
  const schoolLabel = lang === "zh" ? app.schoolNameZh || app.schoolName : app.schoolName;
  const programLabel = lang === "zh" ? app.programNameZh || app.programName : app.programName;

  const toggleStage = (stageId: string) => {
    setExpandedStages((prev) => {
      const next = new Set(prev);
      next.has(stageId) ? next.delete(stageId) : next.add(stageId);
      return next;
    });
  };

  // Count essays
  const essayTasks = app.tasksState.tasks.filter((t) => t.stageId === "essays");

  return (
    <div>
      {/* Back button */}
      <button
        onClick={() => router.push("/schools")}
        style={{
          display: "flex", alignItems: "center", gap: 6, background: "none", border: "none",
          cursor: "pointer", color: theme.textSecondary, fontSize: 13, marginBottom: 20,
          padding: 0,
        }}
      >
        <ArrowLeft size={14} />
        {t(lang, "back")}
      </button>

      {/* ── Header Card ── */}
      <div style={{
        background: theme.card, borderRadius: 12, border: `1px solid ${theme.border}`,
        overflow: "hidden", marginBottom: 24,
      }}>
        {/* Top bar with tier color */}
        <div style={{ height: 4, background: tier.bar }} />

        <div style={{ padding: "20px 24px", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
              <h1 style={{ margin: 0, fontSize: 20, fontWeight: 600, color: theme.text, fontFamily: "Georgia, serif" }}>
                {schoolLabel}
              </h1>
              <button
                onClick={() => cycleTier(app.id)}
                style={{
                  padding: "2px 10px", borderRadius: 12, border: "none", cursor: "pointer",
                  fontSize: 11, fontWeight: 600, background: tier.bg, color: tier.fg,
                }}
              >
                {lang === "zh" ? tier.zh : tier.en}
              </button>
            </div>
            <p style={{ margin: 0, fontSize: 14, color: theme.textSecondary }}>{programLabel}</p>
            <p style={{ margin: "4px 0 0", fontSize: 12, color: theme.textMuted }}>{app.degree}</p>
          </div>

          {/* Right side: deadline + progress */}
          <div style={{ textAlign: "right", minWidth: 140 }}>
            {app.deadline && (
              <div style={{ marginBottom: 8 }}>
                <div style={{ fontSize: 11, color: theme.textMuted, marginBottom: 2 }}>
                  {lang === "zh" ? "截止日期" : "Deadline"}
                </div>
                <div style={{
                  fontSize: 14, fontWeight: 600,
                  color: daysLeft !== null && daysLeft < 30 ? theme.danger : theme.text,
                }}>
                  {new Date(app.deadline).toLocaleDateString(lang === "zh" ? "zh-CN" : "en-US", {
                    month: "short", day: "numeric", year: "numeric",
                  })}
                </div>
                {daysLeft !== null && (
                  <div style={{
                    fontSize: 11, marginTop: 2,
                    color: daysLeft < 0 ? theme.danger : daysLeft < 30 ? theme.warning : theme.textMuted,
                  }}>
                    {daysLeft < 0
                      ? (lang === "zh" ? "已过期" : "Past due")
                      : `${daysLeft} ${lang === "zh" ? "天" : "days left"}`}
                  </div>
                )}
              </div>
            )}

            {/* Progress ring */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 8 }}>
              <div style={{ position: "relative", width: 36, height: 36 }}>
                <svg width="36" height="36" viewBox="0 0 36 36">
                  <circle cx="18" cy="18" r="15" fill="none" stroke={theme.border} strokeWidth="3" />
                  <circle
                    cx="18" cy="18" r="15" fill="none"
                    stroke={progressPct === 100 ? theme.success : theme.accent}
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeDasharray={`${progressPct * 0.942} 100`}
                    transform="rotate(-90 18 18)"
                  />
                </svg>
                <div style={{
                  position: "absolute", inset: 0, display: "flex", alignItems: "center",
                  justifyContent: "center", fontSize: 9, fontWeight: 600, color: theme.text,
                }}>
                  {progressPct}%
                </div>
              </div>
              <div style={{ fontSize: 11, color: theme.textMuted }}>
                {progress.done}/{progress.total}
              </div>
            </div>
          </div>
        </div>

        {/* Quick links */}
        <div style={{
          padding: "10px 24px 14px", display: "flex", gap: 12,
          borderTop: `1px solid ${theme.border}`, background: theme.muted,
        }}>
          {app.portalUrl && (
            <QuickLink href={app.portalUrl} icon={<ExternalLink size={12} />} label={lang === "zh" ? "申请门户" : "Portal"} />
          )}
          {app.programUrl && (
            <QuickLink href={app.programUrl} icon={<Globe size={12} />} label={lang === "zh" ? "项目官网" : "Program page"} />
          )}
        </div>
      </div>

      {/* ── Tabs ── */}
      <div style={{ display: "flex", gap: 0, borderBottom: `1px solid ${theme.border}`, marginBottom: 20 }}>
        {(["tasks", "requirements", "essays", "notes"] as TabId[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: "8px 16px", fontSize: 13, fontWeight: activeTab === tab ? 600 : 400,
              color: activeTab === tab ? theme.text : theme.textMuted,
              background: "none", border: "none", borderBottom: activeTab === tab ? `2px solid ${theme.accent}` : "2px solid transparent",
              cursor: "pointer", transition: "all 0.15s",
            }}
          >
            {TAB_LABELS[tab][lang]}
            {tab === "essays" && essayTasks.length > 0 && (
              <span style={{ marginLeft: 4, fontSize: 11, color: theme.textMuted }}>({essayTasks.length})</span>
            )}
          </button>
        ))}
      </div>

      {/* ── Tab content ── */}
      {activeTab === "tasks" && (
        <TasksTab app={app} lang={lang} toggleTask={toggleTask} expandedStages={expandedStages} toggleStage={toggleStage} />
      )}
      {activeTab === "requirements" && (
        <RequirementsTab app={app} lang={lang} />
      )}
      {activeTab === "essays" && (
        <EssaysTab app={app} lang={lang} toggleTask={toggleTask} />
      )}
      {activeTab === "notes" && (
        <NotesTab lang={lang} />
      )}
    </div>
  );
}

// ── Tasks Tab (vertical stages view) ──

function TasksTab({
  app, lang, toggleTask, expandedStages, toggleStage,
}: {
  app: AppProgram; lang: Lang;
  toggleTask: (appId: string, taskId: string) => void;
  expandedStages: Set<string>;
  toggleStage: (id: string) => void;
}) {
  return (
    <div>
      {PHASES.map((phase) => {
        const stages = stagesForPhase(phase.id);
        const phaseColor = phase.id === "pre_submit" ? theme.phases.pre
          : phase.id === "waiting" ? theme.phases.wait
          : phase.id === "post_offer" ? theme.phases.post
          : theme.phases.visa;

        return (
          <div key={phase.id} style={{ marginBottom: 24 }}>
            {/* Phase header */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <div style={{ width: 3, height: 16, borderRadius: 2, background: phaseColor }} />
              <h3 style={{ margin: 0, fontSize: 13, fontWeight: 600, color: theme.text, textTransform: "uppercase", letterSpacing: 0.5 }}>
                {lang === "zh" ? phase.titleZh : phase.title}
              </h3>
            </div>

            {stages.map((stage) => {
              const tasks = tasksForStage(app.tasksState, stage.id);
              if (tasks.length === 0) return null;

              const { done, total } = stageProgress(app.tasksState, stage.id);
              const allDone = done === total && total > 0;
              const isExpanded = expandedStages.has(stage.id);

              // Skip non-required stages with all non-required tasks
              const hasRequired = tasks.some((t) => t.required);

              return (
                <div key={stage.id} style={{
                  marginBottom: 6, background: theme.card, borderRadius: 8,
                  border: `1px solid ${allDone ? theme.successBg : theme.border}`,
                  overflow: "hidden",
                }}>
                  {/* Stage header */}
                  <button
                    onClick={() => toggleStage(stage.id)}
                    style={{
                      width: "100%", display: "flex", alignItems: "center", gap: 10,
                      padding: "10px 14px", background: "none", border: "none", cursor: "pointer",
                      textAlign: "left",
                    }}
                  >
                    {isExpanded ? <ChevronDown size={14} color={theme.textMuted} /> : <ChevronRight size={14} color={theme.textMuted} />}
                    <span style={{ flex: 1, fontSize: 13, fontWeight: 500, color: allDone ? theme.success : theme.text }}>
                      {lang === "zh" ? stage.titleZh : stage.title}
                    </span>
                    {!hasRequired && (
                      <span style={{ fontSize: 10, color: theme.textMuted, padding: "1px 6px", background: theme.muted, borderRadius: 4 }}>
                        {lang === "zh" ? "可选" : "optional"}
                      </span>
                    )}
                    <span style={{ fontSize: 11, color: allDone ? theme.success : theme.textMuted, minWidth: 36, textAlign: "right" }}>
                      {done}/{total}
                    </span>
                  </button>

                  {/* Tasks */}
                  {isExpanded && (
                    <div style={{ padding: "0 14px 10px", borderTop: `1px solid ${theme.border}` }}>
                      {tasks.map((task) => (
                        <TaskRow key={task.id} task={task} appId={app.id} lang={lang} toggleTask={toggleTask} />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

function TaskRow({
  task, appId, lang, toggleTask,
}: {
  task: Task; appId: string; lang: Lang;
  toggleTask: (appId: string, taskId: string) => void;
}) {
  const label = lang === "zh" ? task.titleZh : task.title;

  return (
    <div style={{
      display: "flex", alignItems: "flex-start", gap: 8, padding: "7px 0",
      borderBottom: `1px solid ${theme.muted}`,
    }}>
      <button
        onClick={() => toggleTask(appId, task.id)}
        style={{ background: "none", border: "none", cursor: "pointer", padding: 0, marginTop: 1, flexShrink: 0 }}
      >
        {task.completed
          ? <CheckCircle2 size={16} color={theme.success} />
          : <Circle size={16} color={theme.border} />}
      </button>

      <div style={{ flex: 1, minWidth: 0 }}>
        <span style={{
          fontSize: 13, color: task.completed ? theme.textMuted : theme.text,
          textDecoration: task.completed ? "line-through" : "none",
        }}>
          {label}
        </span>
        {task.dueDate && !task.completed && (
          <span style={{ fontSize: 10, color: theme.textMuted, marginLeft: 8 }}>
            <Clock size={10} style={{ verticalAlign: -1, marginRight: 2 }} />
            {task.dueDate}
          </span>
        )}
      </div>

      <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
        {task.url && (
          <a href={task.url} target="_blank" rel="noopener noreferrer"
            style={{ color: theme.accent, display: "flex", alignItems: "center" }}
            title={lang === "zh" ? "执行" : "Do this"}>
            <ExternalLink size={12} />
          </a>
        )}
        {task.sourceUrl && (
          <a href={task.sourceUrl} target="_blank" rel="noopener noreferrer"
            style={{ color: theme.textMuted, display: "flex", alignItems: "center" }}
            title={lang === "zh" ? "来源" : "Source"}>
            <Globe size={11} />
          </a>
        )}
      </div>
    </div>
  );
}

// ── Requirements Tab ──

function RequirementsTab({ app, lang }: { app: AppProgram; lang: Lang }) {
  const d = app.extractedData || {};

  // Build fields dynamically from extracted data
  const sections: Array<{ title: string; titleZh: string; fields: Array<{ label: string; labelZh: string; value: string | null }> }> = [
    {
      title: "Test scores", titleZh: "标化成绩",
      fields: [
        { label: "TOEFL", labelZh: "托福",
          value: d.toeflMin ? `Min: ${d.toeflMin}${d.toeflMedian ? ` / Median: ${d.toeflMedian}` : ''}`
            : d.toeflRequired === false ? (lang === "zh" ? "不需要" : "Not required")
            : null },
        { label: "IELTS", labelZh: "雅思",
          value: d.ieltsMin ? `Min: ${d.ieltsMin}` : null },
        { label: "GRE", labelZh: "GRE",
          value: d.greRequired === true ? (d.greMin ? `Required (min: ${d.greMin})` : (lang === "zh" ? "需要" : "Required"))
            : d.greRequired === false ? (lang === "zh" ? "不需要" : "Not required")
            : null },
        { label: "GMAT", labelZh: "GMAT",
          value: d.gmatAccepted === true ? (lang === "zh" ? "接受" : "Accepted")
            : d.gmatAccepted === false ? (lang === "zh" ? "不接受" : "Not accepted")
            : null },
        { label: "GPA minimum", labelZh: "最低GPA", value: d.gpaMin ? `${d.gpaMin}` : null },
      ],
    },
    {
      title: "Application materials", titleZh: "申请材料",
      fields: [
        { label: "Recommendation letters", labelZh: "推荐信",
          value: d.recsRequired ? `${d.recsRequired} letters${d.recsAcademicMin ? ` (${d.recsAcademicMin} academic)` : ''}${d.recsProfessionalOk ? ' · professional OK' : ''}` : null },
        { label: "Resume", labelZh: "简历",
          value: d.resumeRequired === true ? (lang === "zh" ? "需要" : "Required") : d.resumeRequired === false ? (lang === "zh" ? "不需要" : "Not required") : null },
        { label: "Writing sample", labelZh: "写作样本",
          value: d.writingSampleRequired === true ? (d.writingSampleDetails || (lang === "zh" ? "需要" : "Required"))
            : d.writingSampleRequired === false ? (lang === "zh" ? "不需要" : "Not required") : null },
        { label: "Portfolio", labelZh: "作品集",
          value: d.portfolioRequired === true ? (lang === "zh" ? "需要" : "Required") : d.portfolioRequired === false ? (lang === "zh" ? "不需要" : "Not required") : null },
        { label: "Transcripts", labelZh: "成绩单",
          value: d.transcriptsRequired === true ? (lang === "zh" ? "需要" : "Required") : null },
        { label: "WES evaluation", labelZh: "WES认证",
          value: d.wesRequired === true ? (d.wesEvalType ? `Required (${d.wesEvalType})` : (lang === "zh" ? "需要" : "Required"))
            : d.wesRequired === false ? (lang === "zh" ? "不需要" : "Not required") : null },
      ],
    },
    {
      title: "Interview", titleZh: "面试",
      fields: [
        { label: "Interview", labelZh: "面试",
          value: d.interviewRequired === true ? (d.interviewFormat || (lang === "zh" ? "需要" : "Required"))
            : d.interviewRequired === false ? (lang === "zh" ? "不需要" : "Not required") : null },
        { label: "Video essay", labelZh: "视频文书",
          value: d.videoEssayRequired === true ? (d.videoEssayDetails || (lang === "zh" ? "需要" : "Required"))
            : d.videoEssayRequired === false ? (lang === "zh" ? "不需要" : "Not required") : null },
      ],
    },
    {
      title: "Cost & deadlines", titleZh: "费用与截止日期",
      fields: [
        { label: "Total tuition", labelZh: "总学费",
          value: d.estimatedTotalTuition ? `$${d.estimatedTotalTuition.toLocaleString()}` : null },
        { label: "Cost per credit", labelZh: "每学分费用",
          value: d.costPerCredit ? `$${d.costPerCredit.toLocaleString()}` : null },
        { label: "Application fee", labelZh: "申请费",
          value: d.applicationFee ? `$${d.applicationFee}` : null },
        { label: "Deadline (priority)", labelZh: "截止日期（优先）", value: d.deadlineEarly || null },
        { label: "Deadline (regular)", labelZh: "截止日期（常规）", value: d.deadlineRegular || null },
        { label: "Deadline (final)", labelZh: "截止日期（最终）", value: d.deadlineFinal || null },
        { label: "Deadline notes", labelZh: "截止日期备注", value: d.deadlineNotes || null },
      ],
    },
    {
      title: "Program details", titleZh: "项目信息",
      fields: [
        { label: "Degree", labelZh: "学位", value: d.degree || app.degree || null },
        { label: "Duration", labelZh: "学制", value: d.duration || null },
        { label: "Format", labelZh: "形式", value: d.format || null },
        { label: "Total credits", labelZh: "总学分", value: d.totalCredits ? `${d.totalCredits}` : null },
        { label: "Department", labelZh: "院系", value: d.department || null },
        { label: "Career outcomes", labelZh: "就业去向", value: d.careerOutcomes || null },
      ],
    },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {sections.map((section, si) => {
        // Only show sections that have at least one non-null field
        const filledFields = section.fields.filter(f => f.value !== null);
        if (filledFields.length === 0) return null;

        return (
          <div key={si} style={{ background: theme.card, borderRadius: 10, border: `1px solid ${theme.border}`, overflow: "hidden" }}>
            <div style={{ padding: "8px 16px", background: theme.muted, borderBottom: `1px solid ${theme.border}` }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: theme.textSecondary, textTransform: "uppercase", letterSpacing: 0.5 }}>
                {lang === "zh" ? section.titleZh : section.title}
              </span>
            </div>
            {filledFields.map((f, i) => (
              <div key={i} style={{
                display: "flex", justifyContent: "space-between", padding: "10px 16px",
                borderBottom: i < filledFields.length - 1 ? `1px solid ${theme.muted}` : "none",
              }}>
                <span style={{ fontSize: 13, color: theme.textSecondary }}>{lang === "zh" ? f.labelZh : f.label}</span>
                <span style={{ fontSize: 13, fontWeight: 500, color: theme.text, maxWidth: "60%", textAlign: "right" }}>
                  {f.value}
                </span>
              </div>
            ))}
          </div>
        );
      })}

      {/* Curriculum */}
      {d.curriculum && d.curriculum.length > 0 && (
        <div style={{ background: theme.card, borderRadius: 10, border: `1px solid ${theme.border}`, overflow: "hidden" }}>
          <div style={{ padding: "8px 16px", background: theme.muted, borderBottom: `1px solid ${theme.border}` }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: theme.textSecondary, textTransform: "uppercase", letterSpacing: 0.5 }}>
              {lang === "zh" ? "课程设置" : "Curriculum"}
            </span>
          </div>
          <div style={{ padding: "10px 16px", display: "flex", flexWrap: "wrap", gap: 6 }}>
            {d.curriculum.map((course: string, i: number) => (
              <span key={i} style={{
                fontSize: 12, padding: "3px 10px", background: theme.muted, borderRadius: 12, color: theme.textSecondary,
              }}>
                {course}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Source links */}
      {app.programUrl && (
        <div style={{ padding: "10px 16px", background: theme.muted, borderRadius: 10 }}>
          <a href={app.programUrl} target="_blank" rel="noopener noreferrer"
            style={{ fontSize: 12, color: theme.accent, textDecoration: "none", display: "flex", alignItems: "center", gap: 4 }}>
            <Globe size={12} />
            {lang === "zh" ? "查看官方项目页面" : "View official program page"}
          </a>
        </div>
      )}
    </div>
  );
}

// ── Essays Tab ──

function EssaysTab({
  app, lang, toggleTask,
}: {
  app: AppProgram; lang: Lang;
  toggleTask: (appId: string, taskId: string) => void;
}) {
  const essayTasks = app.tasksState.tasks.filter((t) => t.stageId === "essays");

  if (essayTasks.length === 0) {
    return (
      <div style={{ padding: 24, textAlign: "center", color: theme.textMuted, fontSize: 13 }}>
        {lang === "zh" ? "暂无文书题目信息" : "No essay prompts available"}
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {essayTasks.map((task) => {
        const meta = task.meta as Record<string, unknown> | undefined;
        const prompt = meta?.prompt as string | undefined;
        const wordLimit = meta?.wordLimit as number | undefined;
        const essayType = meta?.essayType as string | undefined;

        const TYPE_LABELS: Record<string, { en: string; zh: string }> = {
          sop: { en: "Statement of Purpose", zh: "学术目标陈述" },
          personal_statement: { en: "Personal Statement", zh: "个人陈述" },
          cohort: { en: "Cohort Essay", zh: "群体贡献文书" },
          writing_sample: { en: "Writing Sample", zh: "写作范例" },
          program_specific: { en: "Program-Specific", zh: "项目补充文书" },
          video_essay: { en: "Video Essay", zh: "视频文书" },
        };

        const typeLabel = essayType && TYPE_LABELS[essayType]
          ? TYPE_LABELS[essayType][lang]
          : (lang === "zh" ? task.titleZh : task.title);

        return (
          <div key={task.id} style={{
            background: theme.card, borderRadius: 10, border: `1px solid ${theme.border}`,
            overflow: "hidden",
          }}>
            <div style={{ padding: "14px 16px" }}>
              {/* Type + completion */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <FileText size={14} color={theme.categories.essays} />
                  <span style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5, color: theme.categories.essays }}>
                    {typeLabel}
                  </span>
                  {wordLimit && (
                    <span style={{ fontSize: 11, color: theme.textMuted }}>
                      · {wordLimit} {lang === "zh" ? "字" : "words"}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => toggleTask(app.id, task.id)}
                  style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}
                >
                  {task.completed
                    ? <CheckCircle2 size={16} color={theme.success} />
                    : <Circle size={16} color={theme.border} />}
                </button>
              </div>

              {/* Prompt text */}
              {prompt ? (
                <p style={{ margin: 0, fontSize: 13, lineHeight: 1.6, color: theme.text }}>
                  {prompt}
                </p>
              ) : (
                <p style={{ margin: 0, fontSize: 13, color: theme.textMuted, fontStyle: "italic" }}>
                  {lang === "zh" ? task.titleZh : task.title}
                </p>
              )}
            </div>

            {/* Source */}
            {task.sourceUrl && (
              <div style={{ padding: "8px 16px", borderTop: `1px solid ${theme.muted}`, background: theme.muted }}>
                <a href={task.sourceUrl} target="_blank" rel="noopener noreferrer"
                  style={{ fontSize: 11, color: theme.textMuted, textDecoration: "none", display: "flex", alignItems: "center", gap: 4 }}>
                  <Globe size={10} />
                  {lang === "zh" ? "来源" : "Source"}
                </a>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Notes Tab (placeholder for now) ──

function NotesTab({ lang }: { lang: Lang }) {
  const [notes, setNotes] = useState("");

  return (
    <div>
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder={lang === "zh" ? "关于这个项目的笔记..." : "Notes about this program..."}
        style={{
          width: "100%", minHeight: 200, padding: 14, fontSize: 13, lineHeight: 1.6,
          border: `1px solid ${theme.border}`, borderRadius: 10, background: theme.card,
          color: theme.text, resize: "vertical", outline: "none", fontFamily: "inherit",
        }}
      />
      <p style={{ fontSize: 11, color: theme.textMuted, marginTop: 6 }}>
        {lang === "zh" ? "笔记暂存于本页，刷新后不保留（即将支持持久化）" : "Notes are local to this session (persistence coming soon)"}
      </p>
    </div>
  );
}

// ── Shared components ──

function QuickLink({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  return (
    <a
      href={href} target="_blank" rel="noopener noreferrer"
      style={{
        display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12,
        color: theme.accent, textDecoration: "none", padding: "4px 10px",
        background: theme.accentBg, borderRadius: 6,
      }}
    >
      {icon} {label}
    </a>
  );
}

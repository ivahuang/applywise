"use client";

import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight, Check, ExternalLink } from "lucide-react";
import Link from "next/link";
import { theme, tierConfig } from "@/lib/theme/tokens";
import { useApplications } from "@/lib/context/applications";
import type { Task } from "@/lib/tasks";

interface DayTask {
  task: Task;
  appId: string;
  schoolName: string;
  schoolNameZh: string;
  programName: string;
  programNameZh: string;
  tier: string;
}

export default function CalendarPage() {
  const { apps, lang, toggleTask } = useApplications();
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // Build a map: "YYYY-MM-DD" → DayTask[]
  const tasksByDate = useMemo(() => {
    const map = new Map<string, DayTask[]>();
    for (const app of apps) {
      for (const task of app.tasksState.tasks) {
        if (!task.dueDate || !task.required) continue;
        const key = task.dueDate; // already "YYYY-MM-DD"
        if (!map.has(key)) map.set(key, []);
        map.get(key)!.push({
          task,
          appId: app.id,
          schoolName: app.schoolName,
          schoolNameZh: app.schoolNameZh,
          programName: app.programName,
          programNameZh: app.programNameZh,
          tier: app.tier,
        });
      }
    }
    return map;
  }, [apps]);

  // Calendar grid math
  const { year, month } = currentMonth;
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startPad = firstDay.getDay(); // 0=Sun
  const totalDays = lastDay.getDate();

  const prevMonth = () => {
    setCurrentMonth((c) =>
      c.month === 0
        ? { year: c.year - 1, month: 11 }
        : { year: c.year, month: c.month - 1 }
    );
    setSelectedDate(null);
  };

  const nextMonth = () => {
    setCurrentMonth((c) =>
      c.month === 11
        ? { year: c.year + 1, month: 0 }
        : { year: c.year, month: c.month + 1 }
    );
    setSelectedDate(null);
  };

  const monthLabel = firstDay.toLocaleDateString(lang === "zh" ? "zh-CN" : "en-US", {
    year: "numeric",
    month: "long",
  });

  const dayHeaders =
    lang === "zh"
      ? ["日", "一", "二", "三", "四", "五", "六"]
      : ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const today = new Date().toISOString().slice(0, 10);

  // Selected date tasks
  const selectedTasks = selectedDate ? tasksByDate.get(selectedDate) ?? [] : [];

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
              ? "先添加学校，截止日期将自动显示在这里。"
              : "Add schools first — deadlines will appear here automatically."}
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

      {/* Month navigation */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={prevMonth}
          className="p-1.5 rounded-md transition-colors"
          style={{ color: theme.textSecondary }}
        >
          <ChevronLeft size={18} />
        </button>
        <div
          className="text-sm font-semibold"
          style={{ color: theme.text, fontFamily: "Georgia, serif" }}
        >
          {monthLabel}
        </div>
        <button
          onClick={nextMonth}
          className="p-1.5 rounded-md transition-colors"
          style={{ color: theme.textSecondary }}
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Calendar grid */}
      <div
        className="rounded-lg border overflow-hidden mb-4"
        style={{ borderColor: theme.border, background: theme.card }}
      >
        {/* Day headers */}
        <div className="grid grid-cols-7">
          {dayHeaders.map((d) => (
            <div
              key={d}
              className="text-center text-[10px] font-semibold uppercase tracking-wider py-2"
              style={{ color: theme.textMuted, background: theme.muted }}
            >
              {d}
            </div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7">
          {/* Empty cells for padding */}
          {Array.from({ length: startPad }).map((_, i) => (
            <div
              key={`pad-${i}`}
              className="border-t border-r last:border-r-0"
              style={{ borderColor: theme.border + "60", minHeight: 64 }}
            />
          ))}

          {/* Actual days */}
          {Array.from({ length: totalDays }).map((_, i) => {
            const day = i + 1;
            const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
            const dayTasks = tasksByDate.get(dateStr) ?? [];
            const isToday = dateStr === today;
            const isSelected = dateStr === selectedDate;
            const cellIndex = startPad + i;

            return (
              <button
                key={day}
                onClick={() => setSelectedDate(isSelected ? null : dateStr)}
                className="border-t border-r text-left p-1.5 transition-colors relative"
                style={{
                  borderColor: theme.border + "60",
                  borderRightColor: cellIndex % 7 === 6 ? "transparent" : theme.border + "60",
                  minHeight: 64,
                  background: isSelected
                    ? theme.accentBg
                    : isToday
                      ? theme.muted
                      : "transparent",
                }}
              >
                {/* Day number */}
                <div
                  className="text-[11px] font-medium mb-1"
                  style={{
                    color: isToday ? theme.accent : dayTasks.length > 0 ? theme.text : theme.textMuted,
                    fontWeight: isToday ? 700 : 500,
                  }}
                >
                  {day}
                </div>

                {/* Task dots */}
                {dayTasks.length > 0 && (
                  <div className="flex flex-wrap gap-0.5">
                    {dayTasks.slice(0, 6).map((dt, j) => (
                      <div
                        key={j}
                        className="w-1.5 h-1.5 rounded-full"
                        style={{
                          background: tierConfig[dt.tier as keyof typeof tierConfig]?.bar ?? theme.accent,
                        }}
                        title={`${dt.schoolName}: ${dt.task.title}`}
                      />
                    ))}
                    {dayTasks.length > 6 && (
                      <div className="text-[8px]" style={{ color: theme.textMuted }}>
                        +{dayTasks.length - 6}
                      </div>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected date detail */}
      {selectedDate && (
        <div
          className="rounded-lg border p-4"
          style={{ borderColor: theme.border, background: theme.card }}
        >
          <div className="text-xs font-semibold mb-3" style={{ color: theme.textSecondary }}>
            {new Date(selectedDate + "T12:00:00").toLocaleDateString(
              lang === "zh" ? "zh-CN" : "en-US",
              { month: "long", day: "numeric", weekday: "long" }
            )}
          </div>

          {selectedTasks.length === 0 ? (
            <div className="text-xs py-2" style={{ color: theme.textMuted }}>
              {lang === "zh" ? "当天没有待办事项" : "No tasks due on this date"}
            </div>
          ) : (
            <div className="space-y-2">
              {selectedTasks.map((dt) => (
                <div key={`${dt.appId}-${dt.task.id}`} className="flex items-start gap-2 group">
                  {/* Checkbox */}
                  <button
                    onClick={() => toggleTask(dt.appId, dt.task.id)}
                    className="w-4 h-4 mt-0.5 rounded flex-shrink-0 flex items-center justify-center border transition-all"
                    style={{
                      borderColor: dt.task.completed ? theme.accent : theme.borderHover,
                      background: dt.task.completed ? theme.accent : "transparent",
                    }}
                  >
                    {dt.task.completed && <Check size={10} color="#fff" strokeWidth={2.5} />}
                  </button>

                  <div className="flex-1 min-w-0">
                    {/* Task title */}
                    <div
                      className="text-xs"
                      style={{
                        color: dt.task.completed ? theme.textMuted : theme.text,
                        textDecoration: dt.task.completed ? "line-through" : "none",
                      }}
                    >
                      {lang === "zh" ? dt.task.titleZh : dt.task.title}
                    </div>
                    {/* School label */}
                    <div className="flex items-center gap-1 mt-0.5">
                      <span
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ background: tierConfig[dt.tier as keyof typeof tierConfig]?.bar }}
                      />
                      <span className="text-[10px]" style={{ color: theme.textMuted }}>
                        {lang === "zh" ? dt.schoolNameZh : dt.schoolName}
                      </span>
                    </div>
                  </div>

                  {/* Link */}
                  {dt.task.url && (
                    <a
                      href={dt.task.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{ color: theme.textMuted }}
                    >
                      <ExternalLink size={10} />
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Upcoming deadlines summary */}
      <UpcomingList lang={lang} tasksByDate={tasksByDate} />
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
        {lang === "zh" ? "时间线" : "Timeline"}
      </div>
      <div
        className="text-2xl font-semibold mt-0.5 tracking-tight"
        style={{ fontFamily: "Georgia, serif", color: theme.text }}
      >
        {lang === "zh" ? "日历" : "Calendar"}
      </div>
    </div>
  );
}

// ── Upcoming deadlines list ───────────────────────────────

function UpcomingList({
  lang,
  tasksByDate,
}: {
  lang: string;
  tasksByDate: Map<string, DayTask[]>;
}) {
  const today = new Date().toISOString().slice(0, 10);

  // Get next 14 days with tasks
  const upcoming: { date: string; tasks: DayTask[] }[] = [];
  const sorted = Array.from(tasksByDate.entries())
    .filter(([date]) => date >= today)
    .sort(([a], [b]) => (a > b ? 1 : -1));

  for (const [date, tasks] of sorted) {
    const incomplete = tasks.filter((t) => !t.task.completed);
    if (incomplete.length > 0) {
      upcoming.push({ date, tasks: incomplete });
    }
    if (upcoming.length >= 8) break;
  }

  if (upcoming.length === 0) return null;

  return (
    <div className="mt-4">
      <div className="text-xs font-semibold mb-2" style={{ color: theme.textSecondary }}>
        {lang === "zh" ? "即将到来" : "Upcoming"}
      </div>
      <div className="space-y-1.5">
        {upcoming.map(({ date, tasks }) => (
          <div
            key={date}
            className="flex items-baseline gap-3 text-xs"
          >
            <span
              className="font-medium w-16 flex-shrink-0"
              style={{ color: theme.textSecondary }}
            >
              {new Date(date + "T12:00:00").toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              })}
            </span>
            <span style={{ color: theme.text }}>
              {tasks.length} {lang === "zh" ? "项待办" : tasks.length === 1 ? "task" : "tasks"}
            </span>
            <div className="flex gap-0.5">
              {tasks.slice(0, 4).map((dt, i) => (
                <span
                  key={i}
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ background: tierConfig[dt.tier as keyof typeof tierConfig]?.bar }}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

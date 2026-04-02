"use client";
import { theme } from "@/lib/theme/tokens";

export default function CalendarPage() {
  return (
    <div>
      <div className="mb-5">
        <div className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: theme.textMuted }}>
          Deadline overview
        </div>
        <div className="text-2xl font-semibold mt-0.5 tracking-tight" style={{ fontFamily: "Georgia, serif", color: theme.text }}>
          Calendar
        </div>
      </div>
      <div className="text-center py-16 rounded-xl border border-dashed" style={{ borderColor: theme.border }}>
        <div className="text-sm" style={{ color: theme.textSecondary }}>
          Your deadline calendar will appear here once you add schools.
        </div>
      </div>
    </div>
  );
}

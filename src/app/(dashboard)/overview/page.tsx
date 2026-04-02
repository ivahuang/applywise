"use client";

import { theme } from "@/lib/theme/tokens";

export default function OverviewPage() {
  return (
    <div>
      <div className="mb-5">
        <div
          className="text-[11px] font-semibold uppercase tracking-widest"
          style={{ color: theme.textMuted }}
        >
          Overview
        </div>
        <div
          className="text-2xl font-semibold mt-0.5 tracking-tight"
          style={{ fontFamily: "Georgia, serif", color: theme.text }}
        >
          Dashboard
        </div>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-4 gap-2.5 mb-6">
        {[
          { label: "Schools", value: "0" },
          { label: "Progress", value: "0%" },
          { label: "Next deadline", value: "—" },
          { label: "Submitted", value: "0" },
        ].map((m, i) => (
          <div
            key={i}
            className="rounded-lg px-3.5 py-2.5"
            style={{ background: theme.muted }}
          >
            <div
              className="text-[10px] font-semibold uppercase tracking-wider"
              style={{ color: theme.textMuted }}
            >
              {m.label}
            </div>
            <div
              className="text-xl font-semibold mt-0.5"
              style={{ color: theme.text }}
            >
              {m.value}
            </div>
          </div>
        ))}
      </div>

      {/* Empty state */}
      <div
        className="text-center py-16 rounded-xl border border-dashed"
        style={{ borderColor: theme.border }}
      >
        <div
          className="text-sm mb-1"
          style={{ color: theme.textSecondary }}
        >
          Add schools to get started
        </div>
        <div
          className="text-xs"
          style={{ color: theme.textMuted }}
        >
          Go to the Schools tab to search and add programs to your list.
        </div>
      </div>
    </div>
  );
}

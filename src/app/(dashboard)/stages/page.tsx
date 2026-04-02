"use client";
import { theme } from "@/lib/theme/tokens";

export default function StagesPage() {
  return (
    <div>
      <div className="mb-5">
        <div className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: theme.textMuted }}>
          Manage by stage
        </div>
        <div className="text-2xl font-semibold mt-0.5 tracking-tight" style={{ fontFamily: "Georgia, serif", color: theme.text }}>
          Stages
        </div>
      </div>
      <div className="text-center py-16 rounded-xl border border-dashed" style={{ borderColor: theme.border }}>
        <div className="text-sm" style={{ color: theme.textSecondary }}>
          Add schools first, then manage your application stages here.
        </div>
      </div>
    </div>
  );
}

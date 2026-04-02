"use client";

import { useState } from "react";
import { Plus, X, ChevronRight } from "lucide-react";
import Link from "next/link";
import { theme, tierConfig, type Tier } from "@/lib/theme/tokens";
import SchoolSearch from "@/components/dashboard/SchoolSearch";

// Temporary local state — will be replaced by database + React context
interface AppProgram {
  id: string;
  schoolName: string;
  schoolNameZh: string;
  programName: string;
  programNameZh: string;
  degree: string;
  tier: Tier;
  deadline: string | null;
  portalUrl: string | null;
  toeflMin: number | null;
  greRequired: boolean;
  applicationFee: number | null;
}

export default function SchoolsPage() {
  const [apps, setApps] = useState<AppProgram[]>([]);
  const [showSearch, setShowSearch] = useState(false);
  const [lang] = useState<"en" | "zh">("en"); // TODO: get from context

  const addProgram = (progs: any[], school: any) => {
    for (const p of progs) {
      if (apps.some((a) => a.id === p.id)) continue;
      setApps((prev) => [
        ...prev,
        {
          id: p.id,
          schoolName: school.schoolName,
          schoolNameZh: school.schoolNameZh,
          programName: p.name,
          programNameZh: p.nameZh,
          degree: p.degree,
          tier: "target" as Tier,
          deadline: p.deadline,
          portalUrl: p.portalUrl,
          toeflMin: p.toeflMin,
          greRequired: p.greRequired,
          applicationFee: p.applicationFee,
        },
      ]);
    }
  };

  const cycleTier = (id: string) => {
    const order: Tier[] = ["reach", "target", "safe"];
    setApps((prev) =>
      prev.map((a) => {
        if (a.id !== id) return a;
        const idx = order.indexOf(a.tier);
        return { ...a, tier: order[(idx + 1) % 3] };
      })
    );
  };

  const removeApp = (id: string) => {
    setApps((prev) => prev.filter((a) => a.id !== id));
  };

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
              {list.map((app) => (
                <div
                  key={app.id}
                  className="flex items-stretch rounded-[10px] overflow-hidden border transition-all hover:shadow-sm hover:-translate-y-px"
                  style={{ background: theme.card, borderColor: theme.border }}
                >
                  {/* Tier color bar */}
                  <div
                    className="w-1 flex-shrink-0"
                    style={{ background: tierConfig[app.tier].bar }}
                  />

                  <div className="flex-1 px-4 py-3 flex items-center gap-3">
                    {/* School + program info */}
                    <Link href={`/school/${app.id}`} className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold" style={{ color: theme.text }}>
                          {lang === "zh" ? app.schoolNameZh : app.schoolName}
                        </span>
                        <span className="text-xs" style={{ color: theme.textMuted }}>
                          {lang === "zh" ? app.schoolName : app.schoolNameZh}
                        </span>
                      </div>
                      <div className="text-xs mt-0.5" style={{ color: theme.textSecondary }}>
                        {lang === "zh" ? app.programNameZh : app.programName}
                      </div>
                    </Link>

                    {/* Deadline */}
                    {app.deadline && (
                      <div className="text-xs text-right min-w-[60px]" style={{ color: theme.textSecondary }}>
                        {new Date(app.deadline).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                      </div>
                    )}

                    {/* Tier badge (clickable to cycle) */}
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

                    {/* Remove */}
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        removeApp(app.id);
                      }}
                      className="text-base leading-none p-1 transition-colors"
                      style={{ color: theme.textMuted }}
                      title="Remove"
                    >
                      <X size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

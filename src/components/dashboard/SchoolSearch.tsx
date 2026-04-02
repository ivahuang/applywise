"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, Plus, Check, ExternalLink } from "lucide-react";
import { theme } from "@/lib/theme/tokens";

interface ProgramResult {
  id: string;
  name: string;
  nameZh: string;
  degree: string;
  field: string;
  deadline: string | null;
  toeflMin: number | null;
  greRequired: boolean;
  applicationFee: number | null;
  portalUrl: string | null;
  programUrl: string | null;
}

interface SchoolGroup {
  schoolName: string;
  schoolNameZh: string;
  schoolRank: number | null;
  city: string;
  state: string;
  programs: ProgramResult[];
}

interface SchoolSearchProps {
  lang: "en" | "zh";
  existingProgramIds?: Set<string>;
  onSelect: (programs: ProgramResult[], school: SchoolGroup) => void;
  mode?: "onboarding" | "add"; // onboarding allows multi-select, add is one-at-a-time
}

export default function SchoolSearch({ lang, existingProgramIds, onSelect, mode = "add" }: SchoolSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SchoolGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const search = useCallback(async (q: string) => {
    if (q.length < 1) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/schools?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setResults(data.results || []);
    } catch (e) {
      console.error("Search failed:", e);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => search(query), 200);
    return () => clearTimeout(timer);
  }, [query, search]);

  const toggleProgram = (id: string) => {
    if (mode === "add") {
      // In add mode, find the program and school, call onSelect immediately
      for (const group of results) {
        const prog = group.programs.find((p) => p.id === id);
        if (prog) {
          onSelect([prog], group);
          return;
        }
      }
    } else {
      // In onboarding mode, toggle selection
      setSelected((prev) => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        return next;
      });
    }
  };

  const confirmSelection = () => {
    const selectedPrograms: { prog: ProgramResult; school: SchoolGroup }[] = [];
    for (const group of results) {
      for (const prog of group.programs) {
        if (selected.has(prog.id)) {
          selectedPrograms.push({ prog, school: group });
        }
      }
    }
    // Group by school for the callback
    for (const { prog, school } of selectedPrograms) {
      onSelect([prog], school);
    }
  };

  const isAlreadyAdded = (id: string) => existingProgramIds?.has(id) ?? false;

  return (
    <div>
      {/* Search input */}
      <div className="relative mb-4">
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2"
          style={{ color: theme.textMuted }}
        />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={lang === "zh" ? "搜索学校或项目名称..." : "Search schools or programs..."}
          autoFocus
          className="w-full pl-9 pr-4 py-2.5 rounded-lg border text-sm outline-none transition-colors"
          style={{
            background: theme.card,
            borderColor: theme.border,
            color: theme.text,
          }}
          onFocus={(e) => (e.target.style.borderColor = theme.accent)}
          onBlur={(e) => (e.target.style.borderColor = theme.border)}
        />
        {loading && (
          <div
            className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 border-2 rounded-full animate-spin"
            style={{ borderColor: theme.border, borderTopColor: theme.accent }}
          />
        )}
      </div>

      {/* Results */}
      <div className="max-h-[400px] overflow-y-auto space-y-4">
        {results.length === 0 && query.length > 0 && !loading && (
          <div className="text-center py-8 text-sm" style={{ color: theme.textMuted }}>
            {lang === "zh" ? "没有匹配结果" : "No matching results"}
          </div>
        )}

        {results.map((group) => (
          <div key={group.schoolName}>
            {/* School header */}
            <div
              className="flex items-baseline gap-2 pb-1.5 mb-2 border-b text-xs font-semibold"
              style={{ color: theme.textSecondary, borderColor: theme.border }}
            >
              <span>{group.schoolName}</span>
              <span className="font-normal" style={{ color: theme.textMuted }}>
                {group.schoolNameZh}
              </span>
              {group.schoolRank && (
                <span className="ml-auto font-normal" style={{ color: theme.textMuted }}>
                  #{group.schoolRank}
                </span>
              )}
            </div>

            {/* Programs */}
            {group.programs.length > 0 ? (
              group.programs.map((prog) => {
                const added = isAlreadyAdded(prog.id);
                const isSelected = selected.has(prog.id);
                return (
                  <div
                    key={prog.id}
                    onClick={() => !added && toggleProgram(prog.id)}
                    className="flex items-center gap-3 px-2.5 py-2 rounded-md transition-colors"
                    style={{
                      cursor: added ? "default" : "pointer",
                      background: isSelected ? theme.accentBg : "transparent",
                      opacity: added ? 0.5 : 1,
                    }}
                    onMouseEnter={(e) => {
                      if (!added && !isSelected) e.currentTarget.style.background = theme.muted;
                    }}
                    onMouseLeave={(e) => {
                      if (!added && !isSelected) e.currentTarget.style.background = "transparent";
                    }}
                  >
                    {/* Checkbox */}
                    <div
                      className="w-4 h-4 rounded flex-shrink-0 flex items-center justify-center transition-all"
                      style={{
                        border: isSelected || added ? "none" : `1.5px solid ${theme.borderHover}`,
                        background: added ? theme.textMuted : isSelected ? theme.accent : "transparent",
                      }}
                    >
                      {(isSelected || added) && <Check size={10} color="#fff" strokeWidth={2.5} />}
                    </div>

                    {/* Program info */}
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] font-medium truncate" style={{ color: theme.text }}>
                        {lang === "zh" ? prog.nameZh : prog.name}
                      </div>
                      <div className="text-[11px] mt-0.5 flex gap-2" style={{ color: theme.textMuted }}>
                        <span>{prog.degree}</span>
                        <span>·</span>
                        <span>{group.city}, {group.state}</span>
                        {prog.deadline && (
                          <>
                            <span>·</span>
                            <span>DDL {new Date(prog.deadline).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                          </>
                        )}
                        {prog.toeflMin && (
                          <>
                            <span>·</span>
                            <span>TOEFL {prog.toeflMin}+</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Action button for add mode */}
                    {mode === "add" && !added && (
                      <button
                        className="text-xs font-medium px-3 py-1 rounded-md transition-colors flex-shrink-0"
                        style={{ background: theme.accent, color: "#fff" }}
                      >
                        <Plus size={12} className="inline -mt-px mr-0.5" />
                        Add
                      </button>
                    )}
                    {added && (
                      <span className="text-[10px]" style={{ color: theme.textMuted }}>
                        {lang === "zh" ? "已添加" : "Added"}
                      </span>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="px-2.5 py-2 text-xs" style={{ color: theme.textMuted }}>
                {lang === "zh"
                  ? "暂无项目数据——添加后系统将自动从官网获取"
                  : "No program data yet — will be fetched from official site when added"}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Confirm button for onboarding mode */}
      {mode === "onboarding" && selected.size > 0 && (
        <div className="flex justify-end gap-2 mt-4 pt-4 border-t" style={{ borderColor: theme.border }}>
          <button
            onClick={confirmSelection}
            className="text-sm font-medium px-5 py-2 rounded-lg transition-colors"
            style={{ background: theme.buttonBg, color: theme.buttonFg }}
          >
            {lang === "zh" ? "添加所选" : "Add selected"} ({selected.size})
          </button>
        </div>
      )}
    </div>
  );
}

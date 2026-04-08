"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, Plus, Check, Link2, Loader2, ExternalLink } from "lucide-react";
import { theme } from "@/lib/theme/tokens";

export interface ProgramResult {
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
  wesRequired: boolean;
  wesEvalType: string | null;
  recsRequired: number;
  recsAcademicMin: number;
  recsNotes: string | null;
  interviewReq: boolean;
  interviewFormat: string | null;
  admissionsUrl: string | null;
  essays: { title: string; title_zh: string; word_limit: number | null; prompt?: string; type?: string }[] | null;
}

export interface SchoolGroup {
  schoolName: string;
  schoolNameZh: string;
  schoolRank: number | null;
  city: string;
  state: string;
  toeflCode: number | null;
  greCode: number | null;
  intlAdmissionsUrl: string | null;
  programs: ProgramResult[];
}

interface SchoolSearchProps {
  lang: "en" | "zh";
  existingProgramIds?: Set<string>;
  onSelect: (programs: ProgramResult[], school: SchoolGroup) => void;
  mode?: "onboarding" | "add";
}

export default function SchoolSearch({ lang, existingProgramIds, onSelect, mode = "add" }: SchoolSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SchoolGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  // URL extraction state
  const [urlInput, setUrlInput] = useState("");
  const [extracting, setExtracting] = useState(false);
  const [extractResult, setExtractResult] = useState<any>(null);
  const [extractError, setExtractError] = useState("");

  const search = useCallback(async (q: string) => {
    if (q.length < 1) { setResults([]); return; }
    setLoading(true);
    try {
      const res = await fetch(`/api/schools?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setResults(data.results || []);
    } catch (e) { console.error("Search failed:", e); }
    setLoading(false);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => search(query), 200);
    return () => clearTimeout(timer);
  }, [query, search]);

  const toggleProgram = (id: string) => {
    if (mode === "add") {
      for (const group of results) {
        const prog = group.programs.find((p) => p.id === id);
        if (prog) { onSelect([prog], group); return; }
      }
    } else {
      setSelected((prev) => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id); else next.add(id);
        return next;
      });
    }
  };

  const confirmSelection = () => {
    for (const group of results) {
      for (const prog of group.programs) {
        if (selected.has(prog.id)) onSelect([prog], group);
      }
    }
  };

  const isAlreadyAdded = (id: string) => existingProgramIds?.has(id) ?? false;

  // ── URL extraction ────────────────────────────────────

  const extractFromUrl = async () => {
    const url = urlInput.trim();
    if (!url) return;

    if (!url.includes(".edu")) {
      setExtractError(lang === "zh" ? "请输入 .edu 官网链接" : "Please enter a .edu URL");
      return;
    }

    setExtracting(true);
    setExtractError("");
    setExtractResult(null);

    try {
      const res = await fetch("/api/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();

      if (data.ok && data.program) {
        setExtractResult(data);
      } else {
        setExtractError(data.error || "Extraction failed");
      }
    } catch {
      setExtractError(lang === "zh" ? "网络错误，请重试" : "Network error, please retry");
    } finally {
      setExtracting(false);
    }
  };

  const addExtractedProgram = () => {
    if (!extractResult?.program) return;
    const p = extractResult.program;

    const prog: ProgramResult = {
      id: `extracted-${Date.now()}`,
      name: p.program || "Unknown Program",
      nameZh: p.program_zh || p.program || "",
      degree: p.degree || "MS",
      field: p.field || "other",
      deadline: p.deadline || null,
      toeflMin: p.toefl_min || null,
      greRequired: p.gre_required || false,
      applicationFee: p.application_fee || null,
      portalUrl: p.portal_url || null,
      programUrl: p.program_url || urlInput.trim(),
      wesRequired: p.wes_required || false,
      wesEvalType: p.wes_eval_type || null,
      recsRequired: p.recs_required || 3,
      recsAcademicMin: p.recs_academic_min || 2,
      recsNotes: p.recs_notes || null,
      interviewReq: p.interview_required || false,
      interviewFormat: p.interview_format || null,
      admissionsUrl: p.admissions_url || null,
      essays: p.essays || [],
    };

    const school: SchoolGroup = {
      schoolName: p.school || "Unknown School",
      schoolNameZh: p.school_zh || "",
      schoolRank: null,
      city: "",
      state: "",
      toeflCode: null,
      greCode: null,
      intlAdmissionsUrl: null,
      programs: [prog],
    };

    onSelect([prog], school);
    setExtractResult(null);
    setUrlInput("");
  };

  // ── Render ────────────────────────────────────────────

  return (
    <div>
      {/* Search input */}
      <div className="relative mb-3">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: theme.textMuted }} />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={lang === "zh" ? "搜索学校或项目名称..." : "Search schools or programs..."}
          autoFocus
          className="w-full pl-9 pr-4 py-2.5 rounded-lg border text-sm outline-none transition-colors"
          style={{ background: theme.card, borderColor: theme.border, color: theme.text }}
          onFocus={(e) => (e.target.style.borderColor = theme.accent)}
          onBlur={(e) => (e.target.style.borderColor = theme.border)}
        />
        {loading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 border-2 rounded-full animate-spin"
            style={{ borderColor: theme.border, borderTopColor: theme.accent }} />
        )}
      </div>

      {/* URL extraction input */}
      <div
        className="flex gap-2 mb-4 p-2.5 rounded-lg border"
        style={{ background: theme.card, borderColor: theme.border }}
      >
        <Link2 size={14} style={{ color: theme.textMuted, marginTop: 6, flexShrink: 0 }} />
        <input
          value={urlInput}
          onChange={(e) => { setUrlInput(e.target.value); setExtractError(""); setExtractResult(null); }}
          onKeyDown={(e) => { if (e.key === "Enter") extractFromUrl(); }}
          placeholder={lang === "zh" ? "粘贴 .edu 项目链接，AI自动提取..." : "Paste a .edu program URL to auto-extract..."}
          className="flex-1 text-xs outline-none"
          style={{ background: "transparent", color: theme.text }}
        />
        <button
          onClick={extractFromUrl}
          disabled={!urlInput.trim() || extracting}
          className="text-xs px-3 py-1 rounded-md transition-opacity flex items-center gap-1"
          style={{
            background: theme.accent,
            color: "#fff",
            opacity: !urlInput.trim() || extracting ? 0.4 : 1,
          }}
        >
          {extracting ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
          {extracting ? (lang === "zh" ? "提取中..." : "Extracting...") : (lang === "zh" ? "提取" : "Extract")}
        </button>
      </div>

      {/* Extraction error */}
      {extractError && (
        <div className="text-xs mb-3 px-3 py-2 rounded-md" style={{ background: "#FCEBEB", color: "#A32D2D" }}>
          {extractError}
        </div>
      )}

      {/* Extraction result preview */}
      {extractResult?.program && (
        <div
          className="mb-4 p-3 rounded-lg border"
          style={{ borderColor: theme.accent, background: theme.accentBg }}
        >
          <div className="flex items-start justify-between gap-2 mb-2">
            <div>
              <div className="text-sm font-medium" style={{ color: theme.text }}>
                {extractResult.program.program}
              </div>
              <div className="text-xs mt-0.5" style={{ color: theme.textSecondary }}>
                {extractResult.program.department || extractResult.program.school}
                {extractResult.program.degree && ` · ${extractResult.program.degree}`}
                {extractResult.program.duration && ` · ${extractResult.program.duration}`}
              </div>
            </div>
            
              href={urlInput.trim()}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-shrink-0 p-1"
              style={{ color: theme.textMuted }}
            >
              <ExternalLink size={12} />
            </a>
          </div>

          {/* Key details */}
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] mb-3" style={{ color: theme.textSecondary }}>
            {extractResult.program.toefl_min && <span>TOEFL {extractResult.program.toefl_min}+</span>}
            {extractResult.program.gre_required && <span>GRE required</span>}
            {extractResult.program.application_fee && <span>Fee ${extractResult.program.application_fee}</span>}
            {extractResult.program.deadline && <span>DDL {extractResult.program.deadline}</span>}
            {extractResult.program.wes_required && <span>WES required</span>}
            {extractResult.program.essays?.length > 0 && <span>{extractResult.program.essays.length} essays</span>}
          </div>

          {/* Extraction badge */}
          <div className="flex items-center justify-between">
            <div className="text-[10px] flex gap-2" style={{ color: theme.textMuted }}>
              {extractResult.methods?.map((m: string) => (
                <span key={m} className="px-1.5 py-0.5 rounded" style={{ background: theme.muted }}>
                  {m}
                </span>
              ))}
            </div>
            <button
              onClick={addExtractedProgram}
              className="text-xs font-medium px-4 py-1.5 rounded-md transition-colors"
              style={{ background: theme.accent, color: "#fff" }}
            >
              <Plus size={12} className="inline -mt-px mr-0.5" />
              {lang === "zh" ? "添加此项目" : "Add this program"}
            </button>
          </div>
        </div>
      )}

      {/* Search results */}
      <div className="max-h-[400px] overflow-y-auto space-y-4">
        {results.length === 0 && query.length > 0 && !loading && (
          <div className="text-center py-8 text-sm" style={{ color: theme.textMuted }}>
            {lang === "zh" ? "没有匹配结果" : "No matching results"}
          </div>
        )}

        {results.map((group) => (
          <div key={group.schoolName}>
            <div className="flex items-baseline gap-2 pb-1.5 mb-2 border-b text-xs font-semibold"
              style={{ color: theme.textSecondary, borderColor: theme.border }}>
              <span>{group.schoolName}</span>
              <span className="font-normal" style={{ color: theme.textMuted }}>{group.schoolNameZh}</span>
              {group.schoolRank && (
                <span className="ml-auto font-normal" style={{ color: theme.textMuted }}>#{group.schoolRank}</span>
              )}
            </div>

            {group.programs.length > 0 ? (
              group.programs.map((prog) => {
                const added = isAlreadyAdded(prog.id);
                const isSelected = selected.has(prog.id);
                return (
                  <div key={prog.id} onClick={() => !added && toggleProgram(prog.id)}
                    className="flex items-center gap-3 px-2.5 py-2 rounded-md transition-colors"
                    style={{ cursor: added ? "default" : "pointer", background: isSelected ? theme.accentBg : "transparent", opacity: added ? 0.5 : 1 }}
                    onMouseEnter={(e) => { if (!added && !isSelected) e.currentTarget.style.background = theme.muted; }}
                    onMouseLeave={(e) => { if (!added && !isSelected) e.currentTarget.style.background = "transparent"; }}>
                    <div className="w-4 h-4 rounded flex-shrink-0 flex items-center justify-center transition-all"
                      style={{ border: isSelected || added ? "none" : `1.5px solid ${theme.borderHover}`,
                        background: added ? theme.textMuted : isSelected ? theme.accent : "transparent" }}>
                      {(isSelected || added) && <Check size={10} color="#fff" strokeWidth={2.5} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] font-medium truncate" style={{ color: theme.text }}>
                        {lang === "zh" ? prog.nameZh : prog.name}
                      </div>
                      <div className="text-[11px] mt-0.5 flex gap-2" style={{ color: theme.textMuted }}>
                        <span>{prog.degree}</span><span>·</span>
                        <span>{group.city}, {group.state}</span>
                        {prog.deadline && (<><span>·</span><span>DDL {new Date(prog.deadline).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span></>)}
                        {prog.toeflMin && (<><span>·</span><span>TOEFL {prog.toeflMin}+</span></>)}
                      </div>
                    </div>
                    {mode === "add" && !added && (
                      <button className="text-xs font-medium px-3 py-1 rounded-md transition-colors flex-shrink-0"
                        style={{ background: theme.accent, color: "#fff" }}>
                        <Plus size={12} className="inline -mt-px mr-0.5" />Add
                      </button>
                    )}
                    {added && <span className="text-[10px]" style={{ color: theme.textMuted }}>{lang === "zh" ? "已添加" : "Added"}</span>}
                  </div>
                );
              })
            ) : (
              <div className="px-2.5 py-2 text-xs" style={{ color: theme.textMuted }}>
                {lang === "zh" ? "暂无项目数据" : "No program data yet"}
              </div>
            )}
          </div>
        ))}
      </div>

      {mode === "onboarding" && selected.size > 0 && (
        <div className="flex justify-end gap-2 mt-4 pt-4 border-t" style={{ borderColor: theme.border }}>
          <button onClick={confirmSelection} className="text-sm font-medium px-5 py-2 rounded-lg transition-colors"
            style={{ background: theme.buttonBg, color: theme.buttonFg }}>
            {lang === "zh" ? "添加所选" : "Add selected"} ({selected.size})
          </button>
        </div>
      )}
    </div>
  );
}

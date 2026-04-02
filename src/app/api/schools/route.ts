import { NextResponse } from "next/server";
import schoolsData from "@/../prisma/data/seed-us-universities.json";
import programsData from "@/../prisma/data/seed-programs.json";

// In production, this queries the database via Prisma.
// For MVP, we read directly from the seed JSON files.

interface SearchResult {
  schoolName: string;
  schoolNameZh: string;
  schoolRank: number | null;
  city: string;
  state: string;
  programs: {
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
    // ── Added for task generation ──
    wesRequired: boolean;
    recsRequired: number;
    interviewReq: boolean;
    essays: { title: string; title_zh: string; word_limit: number | null }[] | null;
  }[];
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") || "").toLowerCase().trim();
  const degree = searchParams.get("degree"); // filter by degree level

  if (q.length < 1) {
    return NextResponse.json({ results: [] });
  }

  const terms = q.split(/\s+/).filter(Boolean);

  // Build school lookup
  const schoolMap = new Map<string, (typeof schoolsData.schools)[0]>();
  for (const s of schoolsData.schools) {
    schoolMap.set(s.name, s);
  }

  // Filter programs by search terms
  const matchedPrograms = programsData.programs.filter((p) => {
    const haystack = `${p.school} ${p.school_zh} ${p.program} ${p.program_zh} ${p.field} ${p.department || ""}`.toLowerCase();
    const matchesTerms = terms.every((t) => haystack.includes(t));
    const matchesDegree = !degree || p.degree.toLowerCase() === degree.toLowerCase();
    return matchesTerms && matchesDegree;
  });

  // Group by school
  const grouped = new Map<string, SearchResult>();

  for (const p of matchedPrograms) {
    if (!grouped.has(p.school)) {
      const schoolInfo = schoolMap.get(p.school);
      grouped.set(p.school, {
        schoolName: p.school,
        schoolNameZh: p.school_zh,
        schoolRank: schoolInfo?.rank ?? null,
        city: schoolInfo?.city ?? "",
        state: schoolInfo?.state ?? "",
        programs: [],
      });
    }

    const group = grouped.get(p.school)!;
    group.programs.push({
      id: `${p.school.replace(/\s+/g, "-").toLowerCase()}_${p.program.replace(/\s+/g, "-").toLowerCase()}`,
      name: p.program,
      nameZh: p.program_zh,
      degree: p.degree,
      field: p.field,
      deadline: p.deadline,
      toeflMin: p.toefl_min,
      greRequired: p.gre_required,
      applicationFee: p.application_fee,
      portalUrl: p.portal_url,
      programUrl: p.program_url,
      // ── Added for task generation ──
      wesRequired: p.wes_required ?? false,
      recsRequired: p.recs_required ?? 3,
      interviewReq: p.interview_required ?? false,
      essays: p.essays ?? null,
    });
  }

  // Also search schools without program matches (for schools with no Layer 2 data yet)
  if (matchedPrograms.length < 10) {
    for (const s of schoolsData.schools) {
      const haystack = `${s.name} ${s.zh} ${s.short} ${s.city} ${s.state}`.toLowerCase();
      const matches = terms.every((t) => haystack.includes(t));
      if (matches && !grouped.has(s.name)) {
        grouped.set(s.name, {
          schoolName: s.name,
          schoolNameZh: s.zh,
          schoolRank: s.rank,
          city: s.city,
          state: s.state,
          programs: [], // No Layer 2 data yet — will be fetched by AI on demand
        });
      }
    }
  }

  // Sort by rank
  const results = Array.from(grouped.values())
    .sort((a, b) => (a.schoolRank ?? 999) - (b.schoolRank ?? 999))
    .slice(0, 20);

  return NextResponse.json({ results });
}

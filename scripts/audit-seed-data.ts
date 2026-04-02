/**
 * Audit seed-programs.json for data completeness.
 *
 * Run: npx tsx scripts/audit-seed-data.ts
 *
 * Reports:
 * - Programs missing program_url (can't show .edu badge)
 * - Programs missing essays (generateTasks falls back to generic SOP)
 * - Programs missing deadlines (calendar can't show dates)
 * - Programs with verified_at = null
 * - Summary stats
 */

import programsData from "../prisma/data/seed-programs.json";

interface Program {
  school: string;
  program: string;
  program_url: string | null;
  portal_url: string | null;
  deadline: string | null;
  essays: unknown[] | null;
  toefl_min: number | null;
  gre_required: boolean;
  wes_required: boolean;
  recs_required: number;
  verified_at: string | null;
  [key: string]: unknown;
}

const programs = programsData.programs as Program[];

console.log(`\n📊 Seed Data Audit — ${programs.length} programs\n`);
console.log("=".repeat(60));

// ── Missing program_url ───────────────────────────────────
const missingUrl = programs.filter((p) => !p.program_url);
if (missingUrl.length > 0) {
  console.log(`\n❌ Missing program_url (${missingUrl.length}):`);
  for (const p of missingUrl) {
    console.log(`   ${p.school} — ${p.program}`);
  }
} else {
  console.log("\n✅ All programs have program_url");
}

// ── Missing essays ────────────────────────────────────────
const missingEssays = programs.filter((p) => !p.essays || p.essays.length === 0);
if (missingEssays.length > 0) {
  console.log(`\n⚠️  Missing essays (${missingEssays.length}) — will use generic SOP:`);
  for (const p of missingEssays) {
    console.log(`   ${p.school} — ${p.program}`);
  }
} else {
  console.log("\n✅ All programs have essay prompts");
}

// ── Missing deadlines ─────────────────────────────────────
const missingDeadline = programs.filter((p) => !p.deadline);
if (missingDeadline.length > 0) {
  console.log(`\n⚠️  Missing deadline (${missingDeadline.length}) — won't show on calendar:`);
  for (const p of missingDeadline) {
    console.log(`   ${p.school} — ${p.program}`);
  }
} else {
  console.log("\n✅ All programs have deadlines");
}

// ── Missing portal_url ────────────────────────────────────
const missingPortal = programs.filter((p) => !p.portal_url);
if (missingPortal.length > 0) {
  console.log(`\n⚠️  Missing portal_url (${missingPortal.length}):`);
  for (const p of missingPortal) {
    console.log(`   ${p.school} — ${p.program}`);
  }
} else {
  console.log("\n✅ All programs have portal_url");
}

// ── Unverified ────────────────────────────────────────────
const unverified = programs.filter((p) => !p.verified_at);
console.log(`\n📋 Unverified: ${unverified.length}/${programs.length}`);

// ── Summary ───────────────────────────────────────────────
console.log("\n" + "=".repeat(60));
console.log("\n📈 Summary:");
console.log(`   Total programs: ${programs.length}`);
console.log(`   With program_url: ${programs.length - missingUrl.length}`);
console.log(`   With essays: ${programs.length - missingEssays.length}`);
console.log(`   With deadlines: ${programs.length - missingDeadline.length}`);
console.log(`   With portal_url: ${programs.length - missingPortal.length}`);
console.log(`   Verified: ${programs.length - unverified.length}`);

// ── Field coverage by school ──────────────────────────────
const schools = new Map<string, { total: number; complete: number }>();
for (const p of programs) {
  if (!schools.has(p.school)) schools.set(p.school, { total: 0, complete: 0 });
  const s = schools.get(p.school)!;
  s.total++;
  const isComplete = p.program_url && p.essays && p.essays.length > 0 && p.deadline && p.portal_url;
  if (isComplete) s.complete++;
}

console.log(`\n📋 Completeness by school:`);
const sorted = Array.from(schools.entries()).sort(
  ([, a], [, b]) => a.complete / a.total - b.complete / b.total
);
for (const [name, { total, complete }] of sorted) {
  const pct = Math.round((complete / total) * 100);
  const bar = pct === 100 ? "✅" : pct >= 50 ? "🟡" : "❌";
  console.log(`   ${bar} ${name}: ${complete}/${total} (${pct}%)`);
}

console.log("");

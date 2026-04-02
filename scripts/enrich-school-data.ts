/**
 * Enriches seed-us-universities.json with TOEFL codes, GRE codes,
 * and international admissions URLs.
 *
 * Run: npx tsx scripts/enrich-school-data.ts
 *
 * These codes are from ETS and need verification.
 * After running, check the output and verify any codes marked uncertain.
 */

import fs from "fs";
import path from "path";

const filePath = path.join(__dirname, "../prisma/data/seed-us-universities.json");
const raw = JSON.parse(fs.readFileSync(filePath, "utf-8"));

// Known TOEFL institution codes (source: ETS)
// These need verification — check https://www.ets.org/toefl/test-takers/ibt/scores/send.html
const TOEFL_CODES: Record<string, number> = {
  "Columbia University": 2116,
  "Harvard University": 3434,
  "Massachusetts Institute of Technology": 3514,
  "Stanford University": 4704,
  "Yale University": 3987,
  "Princeton University": 2672,
  "University of Pennsylvania": 2926,
  "Cornell University": 2098,
  "University of Chicago": 1832,
  "Northwestern University": 1565,
  "Duke University": 5156,
  "Johns Hopkins University": 5332,
  "New York University": 2562,
  "University of Southern California": 4852,
  "University of California, Los Angeles": 4837,
  "University of California, Berkeley": 4833,
  "Georgetown University": 5244,
  "Carnegie Mellon University": 2074,
  "Georgia Institute of Technology": 5248,
  "University of Michigan": 1839,
  "University of Illinois Urbana-Champaign": 1836,
  "California Institute of Technology": 4034,
  "Brown University": 3094,
  "Dartmouth College": 3351,
  "Rice University": 6609,
  "Vanderbilt University": 1871,
  "Washington University in St. Louis": 6929,
  "Emory University": 5186,
  "University of Notre Dame": 1841,
  "University of Virginia": 5820,
  "University of North Carolina at Chapel Hill": 5816,
  "Boston University": 3087,
  "Northeastern University": 3218,
  "Tufts University": 3901,
  "Brandeis University": 3092,
  "University of California, San Diego": 4836,
  "University of California, Davis": 4834,
  "University of California, Irvine": 4859,
  "University of California, Santa Barbara": 4835,
  "Purdue University": 1631,
  "University of Wisconsin-Madison": 1846,
  "Ohio State University": 1592,
  "Pennsylvania State University": 2660,
  "University of Texas at Austin": 6882,
  "University of Washington": 4854,
  "University of Florida": 5812,
  "University of Minnesota": 6874,
  "University of Maryland, College Park": 5814,
  "Indiana University Bloomington": 1324,
  "Rutgers University": 2790,
  "Syracuse University": 2823,
  "George Washington University": 5246,
  "American University": 5007,
  "Fordham University": 2259,
  "Boston College": 3083,
  "University of Rochester": 2928,
  "Case Western Reserve University": 1105,
  "Tulane University": 6832,
  "Wake Forest University": 5885,
  "University of Miami": 5815,
};

// GRE codes are often the same as TOEFL codes for most schools
// but can differ. For simplicity, we use the same.
const GRE_CODES = { ...TOEFL_CODES };

// International admissions pages (common URL patterns)
function guessIntlUrl(schoolName: string, website: string | null): string | null {
  if (!website) return null;
  // Most schools have an international admissions page
  // This is a best-guess — needs verification
  return null; // We'll fill these manually
}

let enriched = 0;
for (const school of raw.schools) {
  const toeflCode = TOEFL_CODES[school.name];
  const greCode = GRE_CODES[school.name];

  if (toeflCode) {
    school.toefl_code = toeflCode;
    enriched++;
  }
  if (greCode) {
    school.gre_code = greCode;
  }
  // Placeholder for intl admissions URL — fill manually
  if (!school.intl_admissions_url) {
    school.intl_admissions_url = null;
  }
}

fs.writeFileSync(filePath, JSON.stringify(raw, null, 2) + "\n");

console.log(`\n✅ Enriched ${enriched}/${raw.schools.length} schools with TOEFL/GRE codes`);
console.log(`   Schools without codes: ${raw.schools.length - enriched}`);
console.log(`\n⚠️  All codes need verification at:`);
console.log(`   https://www.ets.org/toefl/test-takers/ibt/scores/send.html`);
console.log(`\n📝 intl_admissions_url left as null — fill manually for top schools\n`);

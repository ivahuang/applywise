// ============================================================
// EXTRACTION SCHEMA
// Defines every field the system tries to extract from .edu pages.
// Maps directly to Prisma Program model + extended fields.
// ============================================================

export interface ExtractedProgram {
  // ---- Identity ----
  schoolName: string;          // "Columbia University"
  schoolNameZh?: string;       // "哥伦比亚大学"
  programName: string;         // "M.S. in Strategic Communications"
  programNameZh?: string;
  department?: string;         // "School of Professional Studies"
  degree: string;              // "MS" | "MA" | "PhD" | "MBA"
  field: string;               // "communications" | "data_science" | ...

  // ---- Academics ----
  duration?: string;           // "3 semesters" | "2 years"
  totalCredits?: number;
  format?: string;             // "full-time" | "part-time" | "hybrid"
  curriculum?: string[];       // Key courses or tracks
  
  // ---- Cost ----
  costPerCredit?: number;      // USD
  estimatedTotalTuition?: number;
  applicationFee?: number;
  livingCostEstimate?: number; // monthly, USD

  // ---- Admissions requirements ----
  toeflMin?: number;
  toeflMedian?: number;
  ieltsMin?: number;
  greRequired?: boolean;
  greMin?: number;
  gmatAccepted?: boolean;
  gpaMin?: number;
  wesRequired?: boolean;       // WES credential evaluation
  wesEvalType?: string;        // "course-by-course" | "document-by-document"
  
  // ---- Recommendation letters ----
  recsRequired?: number;       // typically 2-3
  recsAcademicMin?: number;    // minimum academic recs
  recsProfessionalOk?: boolean;
  
  // ---- Deadlines ----
  deadlineEarly?: string;      // ISO date string
  deadlineRegular?: string;
  deadlineFinal?: string;
  deadlineNotes?: string;      // "Rolling admissions" etc.
  
  // ---- Essays ----
  essays?: EssayPrompt[];
  
  // ---- Other requirements ----
  resumeRequired?: boolean;
  writingSampleRequired?: boolean;
  writingSampleDetails?: string;
  portfolioRequired?: boolean;
  interviewRequired?: boolean;
  interviewFormat?: string;    // "video" | "in-person" | "optional"
  videoEssayRequired?: boolean;
  videoEssayDetails?: string;
  transcriptsRequired?: boolean;

  // ---- Career & outcomes ----
  careerOutcomes?: string;     // Brief description of what grads do
  employmentRate?: number;     // percentage
  avgStartingSalary?: number;
  
  // ---- URLs (critical for task generation) ----
  programUrl: string;          // Main program page
  admissionsUrl?: string;      // Admissions/how-to-apply page
  portalUrl?: string;          // Application portal URL
  financialAidUrl?: string;
  
  // ---- Institutional codes (for sending scores) ----
  toeflInstitutionCode?: string;
  toeflDepartmentCode?: string;
  greInstitutionCode?: string;
  greDepartmentCode?: string;
  
  // ---- Meta ----
  extractedAt: string;         // ISO timestamp
  sourceUrls: string[];        // All URLs that were crawled
  confidence: number;          // 0-1, how complete the extraction is
  missingFields: string[];     // Fields we couldn't find
}

export interface EssayPrompt {
  type: 'sop' | 'personal_statement' | 'cohort' | 'writing_sample' | 'program_specific' | 'video_essay' | 'other';
  typeZh?: string;
  prompt: string;
  promptZh?: string;
  wordLimit?: number;
  required: boolean;
}

// Known .edu domain → school name mapping for fast resolution
export const DOMAIN_TO_SCHOOL: Record<string, { name: string; nameZh: string }> = {
  'columbia.edu':     { name: 'Columbia University', nameZh: '哥伦比亚大学' },
  'harvard.edu':      { name: 'Harvard University', nameZh: '哈佛大学' },
  'stanford.edu':     { name: 'Stanford University', nameZh: '斯坦福大学' },
  'mit.edu':          { name: 'Massachusetts Institute of Technology', nameZh: '麻省理工学院' },
  'yale.edu':         { name: 'Yale University', nameZh: '耶鲁大学' },
  'upenn.edu':        { name: 'University of Pennsylvania', nameZh: '宾夕法尼亚大学' },
  'uchicago.edu':     { name: 'University of Chicago', nameZh: '芝加哥大学' },
  'nyu.edu':          { name: 'New York University', nameZh: '纽约大学' },
  'usc.edu':          { name: 'University of Southern California', nameZh: '南加州大学' },
  'northwestern.edu': { name: 'Northwestern University', nameZh: '西北大学' },
  'berkeley.edu':     { name: 'University of California, Berkeley', nameZh: '加州大学伯克利分校' },
  'ucla.edu':         { name: 'University of California, Los Angeles', nameZh: '加州大学洛杉矶分校' },
  'umich.edu':        { name: 'University of Michigan', nameZh: '密歇根大学' },
  'georgetown.edu':   { name: 'Georgetown University', nameZh: '乔治城大学' },
  'cornell.edu':      { name: 'Cornell University', nameZh: '康奈尔大学' },
  'duke.edu':         { name: 'Duke University', nameZh: '杜克大学' },
  'cmu.edu':          { name: 'Carnegie Mellon University', nameZh: '卡内基梅隆大学' },
  'gatech.edu':       { name: 'Georgia Institute of Technology', nameZh: '佐治亚理工学院' },
  'utexas.edu':       { name: 'University of Texas at Austin', nameZh: '得克萨斯大学奥斯汀分校' },
  'wisc.edu':         { name: 'University of Wisconsin-Madison', nameZh: '威斯康星大学麦迪逊分校' },
  'illinois.edu':     { name: 'University of Illinois Urbana-Champaign', nameZh: '伊利诺伊大学香槟分校' },
  'uw.edu':           { name: 'University of Washington', nameZh: '华盛顿大学' },
  'bu.edu':           { name: 'Boston University', nameZh: '波士顿大学' },
  'jhu.edu':          { name: 'Johns Hopkins University', nameZh: '约翰霍普金斯大学' },
  'brown.edu':        { name: 'Brown University', nameZh: '布朗大学' },
  'dartmouth.edu':    { name: 'Dartmouth College', nameZh: '达特茅斯学院' },
  'vanderbilt.edu':   { name: 'Vanderbilt University', nameZh: '范德堡大学' },
  'wustl.edu':        { name: 'Washington University in St. Louis', nameZh: '圣路易斯华盛顿大学' },
  'rice.edu':         { name: 'Rice University', nameZh: '莱斯大学' },
  'emory.edu':        { name: 'Emory University', nameZh: '埃默里大学' },
  'nd.edu':           { name: 'University of Notre Dame', nameZh: '圣母大学' },
  'tufts.edu':        { name: 'Tufts University', nameZh: '塔夫茨大学' },
  'umn.edu':          { name: 'University of Minnesota', nameZh: '明尼苏达大学' },
  'purdue.edu':       { name: 'Purdue University', nameZh: '普渡大学' },
  'osu.edu':          { name: 'Ohio State University', nameZh: '俄亥俄州立大学' },
  'psu.edu':          { name: 'Penn State University', nameZh: '宾夕法尼亚州立大学' },
  'ufl.edu':          { name: 'University of Florida', nameZh: '佛罗里达大学' },
  'unc.edu':          { name: 'University of North Carolina at Chapel Hill', nameZh: '北卡罗来纳大学教堂山分校' },
  'virginia.edu':     { name: 'University of Virginia', nameZh: '弗吉尼亚大学' },
  'rochester.edu':    { name: 'University of Rochester', nameZh: '罗切斯特大学' },
  'brandeis.edu':     { name: 'Brandeis University', nameZh: '布兰迪斯大学' },
  'nyu.edu':          { name: 'New York University', nameZh: '纽约大学' },
};

// Resolve school name from any .edu URL
export function resolveSchoolFromUrl(url: string): { name: string; nameZh: string } | null {
  try {
    const hostname = new URL(url).hostname; // e.g. "sps.columbia.edu"
    // Walk up subdomains: sps.columbia.edu → columbia.edu
    const parts = hostname.split('.');
    for (let i = 0; i < parts.length - 1; i++) {
      const domain = parts.slice(i).join('.');
      if (DOMAIN_TO_SCHOOL[domain]) return DOMAIN_TO_SCHOOL[domain];
    }
    return null;
  } catch {
    return null;
  }
}

// Calculate extraction confidence based on filled fields
export function calculateConfidence(data: Partial<ExtractedProgram>): { confidence: number; missingFields: string[] } {
  const critical = [
    'schoolName', 'programName', 'degree', 'field', 'programUrl',
  ];
  const important = [
    'toeflMin', 'greRequired', 'deadlineRegular', 'recsRequired',
    'essays', 'applicationFee', 'estimatedTotalTuition', 'duration',
  ];
  const nice = [
    'costPerCredit', 'wesRequired', 'interviewRequired', 'writingSampleRequired',
    'portalUrl', 'admissionsUrl', 'careerOutcomes', 'curriculum',
    'toeflInstitutionCode', 'greInstitutionCode',
  ];

  const missing: string[] = [];
  let score = 0;
  let total = 0;

  for (const f of critical) {
    total += 3;
    if ((data as any)[f] != null) score += 3; else missing.push(f);
  }
  for (const f of important) {
    total += 2;
    if ((data as any)[f] != null) score += 2; else missing.push(f);
  }
  for (const f of nice) {
    total += 1;
    if ((data as any)[f] != null) score += 1; else missing.push(f);
  }

  return { confidence: Math.round((score / total) * 100) / 100, missingFields: missing };
}

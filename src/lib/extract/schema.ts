// ============================================================
// EXTRACTION SCHEMA
// Defines every field the system tries to extract from .edu pages.
//
// v2 (2026-04-09): Added plausibility validation, improved confidence calc
// ============================================================

export interface ExtractedProgram {
  // ---- Identity ----
  schoolName: string;
  schoolNameZh?: string;
  programName: string;
  programNameZh?: string;
  department?: string;
  degree: string;
  field: string;

  // ---- Academics ----
  duration?: string;
  totalCredits?: number;
  format?: string;
  curriculum?: string[];
  
  // ---- Cost ----
  costPerCredit?: number;
  estimatedTotalTuition?: number;
  applicationFee?: number;
  livingCostEstimate?: number;

  // ---- Admissions requirements ----
  toeflRequired?: boolean;     // false = waived/not required
  toeflMin?: number;
  toeflMedian?: number;
  ieltsMin?: number;
  greRequired?: boolean;
  greMin?: number;
  gmatAccepted?: boolean;
  gpaMin?: number;
  wesRequired?: boolean;
  wesEvalType?: string;
  
  // ---- Recommendation letters ----
  recsRequired?: number;
  recsAcademicMin?: number;
  recsProfessionalOk?: boolean;
  
  // ---- Deadlines ----
  deadlineEarly?: string;
  deadlineRegular?: string;
  deadlineFinal?: string;
  deadlineNotes?: string;
  
  // ---- Essays ----
  essays?: EssayPrompt[];
  
  // ---- Other requirements ----
  resumeRequired?: boolean;
  writingSampleRequired?: boolean;
  writingSampleDetails?: string;
  portfolioRequired?: boolean;
  interviewRequired?: boolean;
  interviewFormat?: string;
  videoEssayRequired?: boolean;
  videoEssayDetails?: string;
  transcriptsRequired?: boolean;

  // ---- Career & outcomes ----
  careerOutcomes?: string;
  employmentRate?: number;
  avgStartingSalary?: number;
  
  // ---- URLs ----
  programUrl: string;
  admissionsUrl?: string;
  portalUrl?: string;
  financialAidUrl?: string;
  
  // ---- Institutional codes ----
  toeflInstitutionCode?: string;
  toeflDepartmentCode?: string;
  greInstitutionCode?: string;
  greDepartmentCode?: string;
  
  // ---- Meta ----
  extractedAt: string;
  sourceUrls: string[];
  confidence: number;
  missingFields: string[];
}

export interface EssayPrompt {
  type: 'sop' | 'personal_statement' | 'cohort' | 'writing_sample' | 'program_specific' | 'video_essay' | 'other';
  typeZh?: string;
  prompt: string;
  promptZh?: string;
  wordLimit?: number;
  required: boolean;
}

// Known .edu domain → school name mapping
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
};

export function resolveSchoolFromUrl(url: string): { name: string; nameZh: string } | null {
  try {
    const hostname = new URL(url).hostname;
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

// ---- Confidence calculation ----

function hasValue(val: any): boolean {
  if (val == null) return false;
  if (typeof val === 'string' && val.trim() === '') return false;
  if (Array.isArray(val) && val.length === 0) return false;
  return true;
}

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
    'toeflInstitutionCode', 'greInstitutionCode', 'ieltsMin', 'format',
    'videoEssayRequired', 'resumeRequired', 'transcriptsRequired',
  ];

  const missing: string[] = [];
  let score = 0;
  let total = 0;

  for (const f of critical) {
    total += 3;
    if (hasValue((data as any)[f])) score += 3; else missing.push(f);
  }
  for (const f of important) {
    total += 2;
    if (hasValue((data as any)[f])) score += 2; else missing.push(f);
  }
  for (const f of nice) {
    total += 1;
    if (hasValue((data as any)[f])) score += 1; else missing.push(f);
  }

  return { confidence: Math.round((score / total) * 100) / 100, missingFields: missing };
}

// ---- Plausibility validation ----

export function validateExtraction(data: Partial<ExtractedProgram>): string[] {
  const warnings: string[] = [];

  if (data.toeflMin != null) {
    if (data.toeflMin < 0 || data.toeflMin > 120) {
      warnings.push(`TOEFL minimum ${data.toeflMin} is outside valid range (0-120). Likely extraction error.`);
      data.toeflMin = undefined;
    } else if (data.toeflMin < 60) {
      warnings.push(`TOEFL minimum ${data.toeflMin} is unusually low. Please verify.`);
    }
  }

  if (data.ieltsMin != null) {
    if (data.ieltsMin < 0 || data.ieltsMin > 9) {
      warnings.push(`IELTS minimum ${data.ieltsMin} is outside valid range (0-9).`);
      data.ieltsMin = undefined;
    }
  }

  if (data.greMin != null) {
    if (data.greMin < 260 || data.greMin > 340) {
      if (data.greMin >= 130 && data.greMin <= 170) {
        warnings.push(`GRE minimum ${data.greMin} looks like a single-section score, not combined.`);
      } else {
        warnings.push(`GRE minimum ${data.greMin} is outside valid range.`);
        data.greMin = undefined;
      }
    }
  }

  if (data.gpaMin != null) {
    if (data.gpaMin < 0 || data.gpaMin > 4.0) {
      if (data.gpaMin > 4.0 && data.gpaMin <= 100) {
        warnings.push(`GPA minimum ${data.gpaMin} appears to be percentage scale, not 4.0.`);
      } else {
        data.gpaMin = undefined;
      }
    }
  }

  if (data.applicationFee != null && (data.applicationFee < 0 || data.applicationFee > 500)) {
    warnings.push(`Application fee $${data.applicationFee} is unusual. Most programs charge $50-$150.`);
  }

  if (data.estimatedTotalTuition != null) {
    if (data.estimatedTotalTuition < 5000) {
      warnings.push(`Total tuition $${data.estimatedTotalTuition} seems too low. Might be per-semester.`);
    } else if (data.estimatedTotalTuition > 300000) {
      warnings.push(`Total tuition $${data.estimatedTotalTuition} seems too high.`);
    }
  }

  if (data.costPerCredit != null && (data.costPerCredit < 100 || data.costPerCredit > 10000)) {
    warnings.push(`Cost per credit $${data.costPerCredit} is outside typical range ($500-$5000).`);
  }

  if (data.recsRequired != null && (data.recsRequired < 0 || data.recsRequired > 5)) {
    warnings.push(`${data.recsRequired} recommendation letters is unusual. Most require 2-3.`);
  }

  const now = new Date();
  for (const field of ['deadlineEarly', 'deadlineRegular', 'deadlineFinal'] as const) {
    const dateStr = data[field];
    if (dateStr) {
      try {
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) {
          warnings.push(`${field} "${dateStr}" is not a valid date.`);
          (data as any)[field] = undefined;
        }
      } catch {
        (data as any)[field] = undefined;
      }
    }
  }

  if (data.essays && Array.isArray(data.essays)) {
    for (let i = 0; i < data.essays.length; i++) {
      const essay = data.essays[i];
      if (essay.prompt && essay.prompt.length < 20) {
        warnings.push(`Essay ${i + 1} prompt is very short. May not be the full text.`);
      }
    }
  }

  if (data.employmentRate != null) {
    if (data.employmentRate > 0 && data.employmentRate <= 1) {
      data.employmentRate = Math.round(data.employmentRate * 100);
    } else if (data.employmentRate < 0 || data.employmentRate > 100) {
      data.employmentRate = undefined;
    }
  }

  return warnings;
}

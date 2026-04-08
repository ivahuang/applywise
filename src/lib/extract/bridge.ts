// ============================================================
// EXTRACTION → TASK BRIDGE
// Converts an ExtractedProgram into the format expected by
// generateTasks() and the existing ApplicationsProvider.
// This is the glue between smart extraction and the dashboard.
// ============================================================

import type { ExtractedProgram, EssayPrompt } from './schema';

// The Program shape expected by the existing system
// (matches seed-programs.json structure + Prisma model)
export interface ProgramForTasks {
  id: string;
  schoolId: string;
  schoolName: string;
  schoolNameZh?: string;
  name: string;          // program name
  nameZh?: string;
  department?: string;
  degree: string;
  field: string;
  duration?: string;
  totalCredits?: number;
  costPerCredit?: number;
  estimatedTotal?: number;

  // Admissions
  toeflMin?: number;
  toeflMedian?: number;
  greRequired: boolean;
  greMin?: number;
  applicationFee?: number;
  deadlineEarly?: string;
  deadlineRegular?: string;
  deadlineFinal?: string;

  // Program details
  programUrl: string;
  portalUrl?: string;
  essayPrompts?: Array<{
    prompt: string;
    wordLimit?: number;
    type: string;
  }>;
  requiredDocs: string[];

  // Extended fields
  wesRequired?: boolean;
  wesEvalType?: string;
  recsRequired?: number;
  recsAcademicMin?: number;
  interviewRequired?: boolean;
  interviewFormat?: string;
  writingSampleRequired?: boolean;
  videoEssayRequired?: boolean;

  // Score sending codes
  toeflInstitutionCode?: string;
  toeflDepartmentCode?: string;
  greInstitutionCode?: string;
  greDepartmentCode?: string;

  // Meta
  verifiedAt?: string;
  sourceUrl?: string;
  isAutoExtracted: boolean;
}

// Generate a stable ID from school + program name
function generateId(schoolName: string, programName: string): string {
  const base = `${schoolName}-${programName}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 60);
  // Add a short hash for uniqueness
  let hash = 0;
  for (let i = 0; i < base.length; i++) {
    hash = ((hash << 5) - hash + base.charCodeAt(i)) | 0;
  }
  return `ext-${base}-${Math.abs(hash).toString(36)}`;
}

function generateSchoolId(schoolName: string): string {
  return schoolName.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 40);
}

// Build requiredDocs array from extracted fields
function buildRequiredDocs(p: ExtractedProgram): string[] {
  const docs: string[] = [];
  if (p.resumeRequired !== false) docs.push('resume');
  if (p.essays && p.essays.length > 0) {
    const sopTypes = p.essays.filter(e => e.type === 'sop' || e.type === 'personal_statement');
    if (sopTypes.length > 0) docs.push('sop');
    const otherEssays = p.essays.filter(e => e.type !== 'sop' && e.type !== 'personal_statement');
    for (const e of otherEssays) docs.push(e.type);
  }
  if (p.writingSampleRequired) docs.push('writing_sample');
  if (p.videoEssayRequired) docs.push('video_essay');
  if (p.portfolioRequired) docs.push('portfolio');
  return docs;
}

// Convert ExtractedProgram → ProgramForTasks
export function extractedToProgram(ep: ExtractedProgram): ProgramForTasks {
  return {
    id: generateId(ep.schoolName, ep.programName),
    schoolId: generateSchoolId(ep.schoolName),
    schoolName: ep.schoolName,
    schoolNameZh: ep.schoolNameZh || undefined,
    name: ep.programName,
    nameZh: ep.programNameZh || undefined,
    department: ep.department || undefined,
    degree: ep.degree,
    field: ep.field,
    duration: ep.duration || undefined,
    totalCredits: ep.totalCredits || undefined,
    costPerCredit: ep.costPerCredit || undefined,
    estimatedTotal: ep.estimatedTotalTuition || undefined,

    toeflMin: ep.toeflMin || undefined,
    toeflMedian: ep.toeflMedian || undefined,
    greRequired: ep.greRequired ?? false,
    greMin: ep.greMin || undefined,
    applicationFee: ep.applicationFee || undefined,
    deadlineEarly: ep.deadlineEarly || undefined,
    deadlineRegular: ep.deadlineRegular || undefined,
    deadlineFinal: ep.deadlineFinal || undefined,

    programUrl: ep.programUrl,
    portalUrl: ep.portalUrl || undefined,
    essayPrompts: ep.essays?.map((e: EssayPrompt) => ({
      prompt: e.prompt,
      wordLimit: e.wordLimit || undefined,
      type: e.type,
    })),
    requiredDocs: buildRequiredDocs(ep),

    wesRequired: ep.wesRequired || undefined,
    wesEvalType: ep.wesEvalType || undefined,
    recsRequired: ep.recsRequired || undefined,
    recsAcademicMin: ep.recsAcademicMin || undefined,
    interviewRequired: ep.interviewRequired || undefined,
    interviewFormat: ep.interviewFormat || undefined,
    writingSampleRequired: ep.writingSampleRequired || undefined,
    videoEssayRequired: ep.videoEssayRequired || undefined,

    toeflInstitutionCode: ep.toeflInstitutionCode || undefined,
    toeflDepartmentCode: ep.toeflDepartmentCode || undefined,
    greInstitutionCode: ep.greInstitutionCode || undefined,
    greDepartmentCode: ep.greDepartmentCode || undefined,

    verifiedAt: undefined, // Auto-extracted, not human-verified
    sourceUrl: ep.programUrl,
    isAutoExtracted: true,
  };
}

// ============================================================
// HORIZONTAL vs VERTICAL VIEW DATA
// 
// Horizontal (stages view): tasks grouped by stage across all schools
//   → "TOEFL Prep" stage shows TOEFL tasks for ALL programs
//   → This is the existing Stages page
//
// Vertical (program view): all tasks for ONE program
//   → Program detail page shows all 13 stages scoped to this program
//   → This is the new Program Detail page
//
// Both views use the SAME underlying task data from generateTasks().
// The difference is just how you filter/group.
// ============================================================

export interface HorizontalStageView {
  stageId: string;
  stageName: string;
  stageNameZh: string;
  phase: 'pre-submit' | 'waiting' | 'post-offer' | 'visa';
  // Tasks from ALL programs for this stage
  tasks: Array<{
    programId: string;
    schoolName: string;
    programName: string;
    taskId: string;
    title: string;
    titleZh?: string;
    completed: boolean;
    dueDate?: string;
    actionUrl?: string;
    sourceUrl?: string;
  }>;
  // Cross-cutting tasks (apply to all schools)
  globalTasks: Array<{
    taskId: string;
    title: string;
    titleZh?: string;
    completed: boolean;
    notes?: string;
  }>;
}

export interface VerticalProgramView {
  programId: string;
  schoolName: string;
  programName: string;
  tier: 'reach' | 'target' | 'safe';
  deadline?: string;
  confidence: number;
  // All stages and tasks scoped to THIS program
  stages: Array<{
    stageId: string;
    stageName: string;
    phase: string;
    tasks: Array<{
      taskId: string;
      title: string;
      completed: boolean;
      dueDate?: string;
      actionUrl?: string;
    }>;
    progress: number; // 0-1
  }>;
  // Essays for this program
  essays: EssayPrompt[];
  // Relevant atoms/素材 (populated elsewhere)
  atomIds: string[];
}

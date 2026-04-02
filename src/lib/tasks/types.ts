// ============================================================
// Task generation types — Enhanced for granular, linked tasks
// ============================================================

/** A single actionable task within an application */
export interface Task {
  id: string;
  stageId: string;
  title: string;
  titleZh: string;
  completed: boolean;
  required: boolean;
  sortOrder: number;
  dueDate?: string;
  /** Primary action URL — the link the student clicks to DO this task */
  url?: string;
  /** Source URL — where we got the requirement info (usually .edu) */
  sourceUrl?: string;
  meta?: Record<string, unknown>;
}

/** The JSON blob stored in UserApplication.tasksState */
export interface TasksState {
  tasks: Task[];
  generatedAt: string;
  version: number;
}

/** Essay prompt with full detail */
export interface EssayPrompt {
  title: string;
  title_zh: string;
  word_limit: number | null;
  /** Full prompt text from the school's website */
  prompt?: string;
  /** Type: sop, personal_statement, cohort, writing_sample, program_specific, video */
  type?: string;
}

/** Enriched program data needed to generate granular tasks */
export interface ProgramForTasks {
  // ── School-level (passed through from School record) ──
  schoolName: string;
  schoolNameZh?: string;
  toeflCode?: number;       // ETS institution code for TOEFL
  greCode?: number;         // ETS institution code for GRE
  intlAdmissionsUrl?: string; // School's international admissions page

  // ── Scores ──
  toeflMin: number | null;
  toeflRecommended?: number | null;
  greRequired: boolean;

  // ── Credentials ──
  wesRequired: boolean;
  /** "course-by-course" | "document-by-document" | null */
  wesEvalType?: string | null;

  // ── Recommendations ──
  recsRequired: number;
  /** Minimum academic recs, e.g. 2 means "at least 2 from professors" */
  recsAcademicMin?: number;
  recsNotes?: string;       // e.g. "At least 2 academic, 1 may be professional"

  // ── Interview ──
  interviewReq: boolean;
  /** "kira" | "zoom" | "alumni" | "in_person" | null */
  interviewFormat?: string | null;

  // ── Essays ──
  essays: EssayPrompt[] | null;

  // ── Fees & logistics ──
  applicationFee: number | null;
  deadline: string | null;
  deadlineEarly?: string | null;
  deadlineFinal?: string | null;

  // ── URLs ──
  portalUrl: string | null;
  programUrl: string | null;
  /** Direct link to "how to apply" or admissions requirements page */
  admissionsUrl?: string | null;
}

// ── Phase & Stage types (unchanged) ───────────────────────

export type PhaseId = "pre_submit" | "waiting" | "post_offer" | "visa";

export interface StageDef {
  id: string;
  phaseId: PhaseId;
  title: string;
  titleZh: string;
  description: string;
  descriptionZh: string;
  sortOrder: number;
  conditional: boolean;
}

export interface PhaseDef {
  id: PhaseId;
  title: string;
  titleZh: string;
  sortOrder: number;
}

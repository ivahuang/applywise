// ============================================================
// Task generation types
// Matches Prisma: UserApplication.tasksState Json?
// ============================================================

/** A single actionable task within an application */
export interface Task {
  id: string;            // e.g. "wes", "essay-0", "rec-1", "visa-interview"
  stageId: string;       // links to STAGES_DEF
  title: string;         // English
  titleZh: string;       // Chinese
  completed: boolean;
  required: boolean;     // false = conditional / optional
  sortOrder: number;
  dueDate?: string;      // ISO date string, derived from program deadline
  url?: string;          // portal link, program page, etc.
  meta?: Record<string, unknown>; // extra info (e.g. wordLimit for essays)
}

/** The JSON blob stored in UserApplication.tasksState */
export interface TasksState {
  tasks: Task[];
  generatedAt: string;   // ISO timestamp
  version: number;       // bump when generation logic changes
}

/** Minimal program data needed to generate tasks */
export interface ProgramForTasks {
  wesRequired: boolean;
  toeflMin: number | null;
  greRequired: boolean;
  recsRequired: number;
  applicationFee: number | null;
  interviewReq: boolean;
  deadline: string | null;
  essays: EssayPrompt[] | null;
  portalUrl: string | null;
  programUrl: string | null;
}

export interface EssayPrompt {
  title: string;
  title_zh: string;
  word_limit: number | null;
}

/** Phase grouping for the Stages view */
export type PhaseId = "pre_submit" | "waiting" | "post_offer" | "visa";

export interface StageDef {
  id: string;
  phaseId: PhaseId;
  title: string;
  titleZh: string;
  description: string;
  descriptionZh: string;
  sortOrder: number;
  /** When true, stage only appears if program requires it */
  conditional: boolean;
}

export interface PhaseDef {
  id: PhaseId;
  title: string;
  titleZh: string;
  sortOrder: number;
}

import type { ProgramForTasks, Task, TasksState } from "./types";

/**
 * Current generation logic version.
 * Bump this when task definitions change so the UI can prompt
 * users to regenerate stale task lists.
 */
const GENERATION_VERSION = 1;

/**
 * Generate a complete task checklist for one application.
 *
 * Called when a student adds a program to their list.
 * Output is stored as JSON in UserApplication.tasksState.
 *
 * Design notes:
 * - Tasks are grouped by stageId → consumed by the Stages view
 * - Tasks with dueDate → consumed by the Calendar view
 * - `required` = false for conditional items (WES, GRE, interview)
 *   that the program doesn't need — included but marked optional
 *   so the student can still see the full lifecycle
 */
export function generateTasks(program: ProgramForTasks): TasksState {
  const tasks: Task[] = [];
  let order = 0;

  const deadline = program.deadline ? new Date(program.deadline) : null;

  // Helper: create a date N days before the deadline
  function daysBefore(days: number): string | undefined {
    if (!deadline) return undefined;
    const d = new Date(deadline);
    d.setDate(d.getDate() - days);
    return d.toISOString().slice(0, 10);
  }

  // Helper: deadline as ISO date string
  const deadlineStr = deadline ? deadline.toISOString().slice(0, 10) : undefined;

  // ────────────────────────────────────────────────────────
  // Phase 1: Pre-submit
  // ────────────────────────────────────────────────────────

  // Stage: WES
  tasks.push({
    id: "wes-submit",
    stageId: "wes",
    title: "Submit WES credential evaluation",
    titleZh: "提交 WES 学历认证",
    completed: false,
    required: program.wesRequired,
    sortOrder: order++,
    dueDate: daysBefore(56), // 8 weeks before deadline
    url: "https://www.wes.org",
  });

  // Stage: TOEFL
  tasks.push({
    id: "toefl-send",
    stageId: "toefl",
    title: program.toeflMin
      ? `Send official TOEFL scores (min ${program.toeflMin})`
      : "Send official TOEFL scores",
    titleZh: program.toeflMin
      ? `寄送托福官方成绩（最低 ${program.toeflMin}）`
      : "寄送托福官方成绩",
    completed: false,
    required: true,
    sortOrder: order++,
    dueDate: daysBefore(28), // 4 weeks before deadline
  });

  // Stage: GRE
  tasks.push({
    id: "gre-send",
    stageId: "gre",
    title: "Send official GRE scores",
    titleZh: "寄送 GRE 官方成绩",
    completed: false,
    required: program.greRequired,
    sortOrder: order++,
    dueDate: daysBefore(28),
  });

  // Stage: Essays
  const essays = program.essays?.length ? program.essays : null;
  if (essays) {
    for (let i = 0; i < essays.length; i++) {
      const e = essays[i];
      const wordNote = e.word_limit ? ` (${e.word_limit} words)` : "";
      const wordNoteZh = e.word_limit ? `（${e.word_limit}字）` : "";
      tasks.push({
        id: `essay-${i}`,
        stageId: "essays",
        title: `${e.title}${wordNote}`,
        titleZh: `${e.title_zh || e.title}${wordNoteZh}`,
        completed: false,
        required: true,
        sortOrder: order++,
        dueDate: deadlineStr,
        meta: { wordLimit: e.word_limit, essayTitle: e.title },
      });
    }
  } else {
    // Fallback: generic SOP if no essay data
    tasks.push({
      id: "essay-sop",
      stageId: "essays",
      title: "Statement of Purpose",
      titleZh: "学术目标陈述",
      completed: false,
      required: true,
      sortOrder: order++,
      dueDate: deadlineStr,
    });
  }

  // Stage: Recommendations
  const recCount = program.recsRequired ?? 3;
  for (let i = 0; i < recCount; i++) {
    tasks.push({
      id: `rec-${i}`,
      stageId: "recs",
      title: `Recommendation letter #${i + 1}`,
      titleZh: `推荐信 #${i + 1}`,
      completed: false,
      required: true,
      sortOrder: order++,
      dueDate: daysBefore(14), // give recommenders 2 weeks buffer
    });
  }

  // Stage: Forms & Fees
  tasks.push({
    id: "app-form",
    stageId: "fees",
    title: "Complete application form",
    titleZh: "填写申请表",
    completed: false,
    required: true,
    sortOrder: order++,
    dueDate: deadlineStr,
    url: program.portalUrl ?? undefined,
  });

  tasks.push({
    id: "resume",
    stageId: "fees",
    title: "Upload resume / CV",
    titleZh: "上传简历",
    completed: false,
    required: true,
    sortOrder: order++,
    dueDate: deadlineStr,
  });

  if (program.applicationFee) {
    tasks.push({
      id: "app-fee",
      stageId: "fees",
      title: `Pay application fee ($${program.applicationFee})`,
      titleZh: `支付申请费（$${program.applicationFee}）`,
      completed: false,
      required: true,
      sortOrder: order++,
      dueDate: deadlineStr,
      meta: { amount: program.applicationFee },
    });
  }

  // ────────────────────────────────────────────────────────
  // Phase 2: Waiting
  // ────────────────────────────────────────────────────────

  // Stage: Interview
  tasks.push({
    id: "interview-prep",
    stageId: "interview",
    title: "Prepare for admissions interview",
    titleZh: "准备招生面试",
    completed: false,
    required: program.interviewReq,
    sortOrder: order++,
  });

  tasks.push({
    id: "interview-complete",
    stageId: "interview",
    title: "Complete interview",
    titleZh: "完成面试",
    completed: false,
    required: program.interviewReq,
    sortOrder: order++,
  });

  // Stage: Status Tracking
  tasks.push({
    id: "track-portal",
    stageId: "tracking",
    title: "Check application portal for updates",
    titleZh: "查看申请门户更新",
    completed: false,
    required: true,
    sortOrder: order++,
    url: program.portalUrl ?? undefined,
  });

  tasks.push({
    id: "track-supplemental",
    stageId: "tracking",
    title: "Respond to any supplemental requests",
    titleZh: "回复补充材料要求",
    completed: false,
    required: false, // not every school asks for supplements
    sortOrder: order++,
  });

  // ────────────────────────────────────────────────────────
  // Phase 3: Post-offer
  // ────────────────────────────────────────────────────────

  // Stage: Confirm
  tasks.push({
    id: "accept-offer",
    stageId: "confirm",
    title: "Accept or decline offer",
    titleZh: "接受或拒绝录取",
    completed: false,
    required: true,
    sortOrder: order++,
  });

  // Stage: Deposit
  tasks.push({
    id: "pay-deposit",
    stageId: "deposit",
    title: "Pay enrollment deposit",
    titleZh: "支付入学押金",
    completed: false,
    required: true,
    sortOrder: order++,
  });

  // Stage: I-20
  tasks.push({
    id: "request-i20",
    stageId: "i20",
    title: "Request I-20 form",
    titleZh: "申请 I-20 表格",
    completed: false,
    required: true,
    sortOrder: order++,
  });

  tasks.push({
    id: "submit-financial",
    stageId: "i20",
    title: "Submit financial documents",
    titleZh: "提交财务证明",
    completed: false,
    required: true,
    sortOrder: order++,
  });

  // ────────────────────────────────────────────────────────
  // Phase 4: Visa & Pre-departure
  // ────────────────────────────────────────────────────────

  // Stage: F-1 Visa
  tasks.push({
    id: "sevis-fee",
    stageId: "visa",
    title: "Pay SEVIS I-901 fee",
    titleZh: "缴纳 SEVIS I-901 费",
    completed: false,
    required: true,
    sortOrder: order++,
    url: "https://www.fmjfee.com",
  });

  tasks.push({
    id: "visa-schedule",
    stageId: "visa",
    title: "Schedule visa interview",
    titleZh: "预约签证面试",
    completed: false,
    required: true,
    sortOrder: order++,
  });

  tasks.push({
    id: "visa-attend",
    stageId: "visa",
    title: "Attend visa interview",
    titleZh: "参加签证面试",
    completed: false,
    required: true,
    sortOrder: order++,
  });

  // Stage: Pre-departure
  tasks.push({
    id: "housing",
    stageId: "predeparture",
    title: "Arrange housing",
    titleZh: "安排住宿",
    completed: false,
    required: true,
    sortOrder: order++,
  });

  tasks.push({
    id: "health-insurance",
    stageId: "predeparture",
    title: "Enroll in health insurance",
    titleZh: "注册医疗保险",
    completed: false,
    required: true,
    sortOrder: order++,
  });

  tasks.push({
    id: "orientation",
    stageId: "predeparture",
    title: "Register for orientation",
    titleZh: "注册新生迎新活动",
    completed: false,
    required: true,
    sortOrder: order++,
  });

  return {
    tasks,
    generatedAt: new Date().toISOString(),
    version: GENERATION_VERSION,
  };
}

// ── Helpers for consuming TasksState ──────────────────────

/** Get all tasks for a specific stage */
export function tasksForStage(state: TasksState, stageId: string): Task[] {
  return state.tasks
    .filter((t) => t.stageId === stageId)
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

/** Count completed / total for a stage (required tasks only) */
export function stageProgress(state: TasksState, stageId: string) {
  const tasks = state.tasks.filter((t) => t.stageId === stageId && t.required);
  const done = tasks.filter((t) => t.completed).length;
  return { done, total: tasks.length };
}

/** Overall completion for an application (required tasks only) */
export function overallProgress(state: TasksState) {
  const tasks = state.tasks.filter((t) => t.required);
  const done = tasks.filter((t) => t.completed).length;
  return { done, total: tasks.length };
}

/** Toggle a task's completion status, return new TasksState */
export function toggleTask(state: TasksState, taskId: string): TasksState {
  return {
    ...state,
    tasks: state.tasks.map((t) =>
      t.id === taskId ? { ...t, completed: !t.completed } : t
    ),
  };
}

/** All tasks with a dueDate, sorted chronologically — for Calendar view */
export function tasksByDate(state: TasksState): Task[] {
  return state.tasks
    .filter((t) => t.dueDate && t.required)
    .sort((a, b) => (a.dueDate! > b.dueDate! ? 1 : -1));
}

/** Check if the tasks version is outdated */
export function isStale(state: TasksState): boolean {
  return state.version < GENERATION_VERSION;
}

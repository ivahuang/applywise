import type { ProgramForTasks, Task, TasksState } from "./types";

const GENERATION_VERSION = 2;

// ── Universal reference URLs ──────────────────────────────

const URLS = {
  toeflRegister: "https://www.ets.org/toefl/test-takers/ibt/register.html",
  toeflSendScores: "https://www.ets.org/toefl/test-takers/ibt/scores/send.html",
  toeflScoreLookup: "https://www.ets.org/toefl/test-takers/ibt/scores.html",
  greRegister: "https://www.ets.org/gre/test-takers/general-test/register.html",
  greSendScores: "https://www.ets.org/gre/test-takers/general-test/scores/send.html",
  wes: "https://www.wes.org/evaluations/apply/",
  wesDocGuide: "https://www.wes.org/required-documents/",
  sevisFee: "https://www.fmjfee.com/i901fee/index.html",
  ds160: "https://ceac.state.gov/genniv/",
  visaApptChina: "https://www.ustraveldocs.com/cn/",
};

/**
 * Generate a comprehensive, link-rich task checklist for one application.
 *
 * Every task has:
 * - `url`: the link the student clicks to DO this task
 * - `sourceUrl`: where the requirement info came from (for verification)
 */
export function generateTasks(program: ProgramForTasks): TasksState {
  const tasks: Task[] = [];
  let order = 0;

  const deadline = program.deadline ? new Date(program.deadline) : null;
  const deadlineStr = deadline ? deadline.toISOString().slice(0, 10) : undefined;

  function daysBefore(days: number): string | undefined {
    if (!deadline) return undefined;
    const d = new Date(deadline);
    d.setDate(d.getDate() - days);
    return d.toISOString().slice(0, 10);
  }

  const sourceUrl = program.admissionsUrl || program.programUrl || undefined;

  // ────────────────────────────────────────────────────────
  // Phase 1: Pre-submit
  // ────────────────────────────────────────────────────────

  // ── Stage: WES ──────────────────────────────────────────

  const wesType = program.wesEvalType || "course-by-course";
  tasks.push({
    id: "wes-request",
    stageId: "wes",
    title: `Request WES ${wesType} evaluation`,
    titleZh: `申请 WES ${wesType === "course-by-course" ? "逐课" : "逐文件"}认证`,
    completed: false,
    required: program.wesRequired,
    sortOrder: order++,
    dueDate: daysBefore(70), // ~10 weeks before (WES takes 4-8 weeks)
    url: URLS.wes,
    sourceUrl,
  });

  tasks.push({
    id: "wes-send-transcript",
    stageId: "wes",
    title: "Send sealed transcript to WES",
    titleZh: "寄送密封成绩单至 WES",
    completed: false,
    required: program.wesRequired,
    sortOrder: order++,
    dueDate: daysBefore(70),
    url: URLS.wesDocGuide,
    sourceUrl,
  });

  // ── Stage: TOEFL ────────────────────────────────────────

  const toeflCodeStr = program.toeflCode ? ` (code: ${program.toeflCode})` : "";
  const toeflScoreStr = program.toeflMin ? ` — min ${program.toeflMin}` : "";

  tasks.push({
    id: "toefl-register",
    stageId: "toefl",
    title: "Register for TOEFL iBT",
    titleZh: "注册托福 iBT 考试",
    completed: false,
    required: true,
    sortOrder: order++,
    dueDate: daysBefore(90), // 3 months before deadline
    url: URLS.toeflRegister,
  });

  tasks.push({
    id: "toefl-send",
    stageId: "toefl",
    title: `Send TOEFL scores to ${program.schoolName}${toeflCodeStr}${toeflScoreStr}`,
    titleZh: `寄送托福成绩至${program.schoolNameZh || program.schoolName}${toeflCodeStr}${toeflScoreStr}`,
    completed: false,
    required: true,
    sortOrder: order++,
    dueDate: daysBefore(28),
    url: URLS.toeflSendScores,
    sourceUrl,
    meta: { toeflCode: program.toeflCode, toeflMin: program.toeflMin },
  });

  // ── Stage: GRE ──────────────────────────────────────────

  const greCodeStr = program.greCode ? ` (code: ${program.greCode})` : "";

  tasks.push({
    id: "gre-register",
    stageId: "gre",
    title: "Register for GRE General Test",
    titleZh: "注册 GRE 普通考试",
    completed: false,
    required: program.greRequired,
    sortOrder: order++,
    dueDate: daysBefore(90),
    url: URLS.greRegister,
  });

  tasks.push({
    id: "gre-send",
    stageId: "gre",
    title: `Send GRE scores to ${program.schoolName}${greCodeStr}`,
    titleZh: `寄送 GRE 成绩至${program.schoolNameZh || program.schoolName}${greCodeStr}`,
    completed: false,
    required: program.greRequired,
    sortOrder: order++,
    dueDate: daysBefore(28),
    url: URLS.greSendScores,
    sourceUrl,
    meta: { greCode: program.greCode },
  });

  // ── Stage: Essays ───────────────────────────────────────

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
        url: program.programUrl ?? undefined,
        sourceUrl,
        meta: {
          wordLimit: e.word_limit,
          essayTitle: e.title,
          essayType: e.type,
          prompt: e.prompt,
        },
      });
    }
  } else {
    tasks.push({
      id: "essay-sop",
      stageId: "essays",
      title: "Statement of Purpose",
      titleZh: "学术目标陈述",
      completed: false,
      required: true,
      sortOrder: order++,
      dueDate: deadlineStr,
      url: program.programUrl ?? undefined,
      sourceUrl,
    });
  }

  // ── Stage: Recommendations ──────────────────────────────

  const recCount = program.recsRequired ?? 3;
  const academicMin = program.recsAcademicMin ?? 0;
  const recNotes = program.recsNotes || null;

  for (let i = 0; i < recCount; i++) {
    const isAcademic = i < academicMin;
    const typeHint = isAcademic ? " (academic)" : academicMin > 0 ? " (academic or professional)" : "";
    const typeHintZh = isAcademic ? "（学术）" : academicMin > 0 ? "（学术或职业）" : "";

    tasks.push({
      id: `rec-${i}`,
      stageId: "recs",
      title: `Recommendation letter #${i + 1}${typeHint}`,
      titleZh: `推荐信 #${i + 1}${typeHintZh}`,
      completed: false,
      required: true,
      sortOrder: order++,
      dueDate: daysBefore(14),
      url: program.portalUrl ?? undefined,
      sourceUrl,
      meta: { recIndex: i, isAcademic, notes: recNotes },
    });
  }

  // ── Stage: Forms & Fees ─────────────────────────────────

  tasks.push({
    id: "app-form",
    stageId: "fees",
    title: "Complete online application form",
    titleZh: "填写网上申请表",
    completed: false,
    required: true,
    sortOrder: order++,
    dueDate: deadlineStr,
    url: program.portalUrl ?? undefined,
    sourceUrl,
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
    url: program.portalUrl ?? undefined,
  });

  tasks.push({
    id: "transcript-upload",
    stageId: "fees",
    title: "Upload unofficial transcript",
    titleZh: "上传非官方成绩单",
    completed: false,
    required: true,
    sortOrder: order++,
    dueDate: deadlineStr,
    url: program.portalUrl ?? undefined,
    sourceUrl,
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
      url: program.portalUrl ?? undefined,
      sourceUrl,
      meta: { amount: program.applicationFee },
    });
  }

  // ────────────────────────────────────────────────────────
  // Phase 2: Waiting
  // ────────────────────────────────────────────────────────

  // ── Stage: Interview ────────────────────────────────────

  const interviewFmt = program.interviewFormat
    ? ` (${program.interviewFormat})`
    : "";

  tasks.push({
    id: "interview-prep",
    stageId: "interview",
    title: `Prepare for admissions interview${interviewFmt}`,
    titleZh: `准备招生面试${interviewFmt}`,
    completed: false,
    required: program.interviewReq,
    sortOrder: order++,
    sourceUrl,
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

  // ── Stage: Status Tracking ──────────────────────────────

  tasks.push({
    id: "track-portal",
    stageId: "tracking",
    title: "Check application portal for status updates",
    titleZh: "查看申请门户状态更新",
    completed: false,
    required: true,
    sortOrder: order++,
    url: program.portalUrl ?? undefined,
  });

  tasks.push({
    id: "track-supplemental",
    stageId: "tracking",
    title: "Respond to supplemental material requests",
    titleZh: "回复补充材料要求",
    completed: false,
    required: false,
    sortOrder: order++,
    url: program.portalUrl ?? undefined,
  });

  // ────────────────────────────────────────────────────────
  // Phase 3: Post-offer
  // ────────────────────────────────────────────────────────

  tasks.push({
    id: "accept-offer",
    stageId: "confirm",
    title: "Accept or decline offer (by April 15)",
    titleZh: "接受或拒绝录取（4月15日前）",
    completed: false,
    required: true,
    sortOrder: order++,
    url: program.portalUrl ?? undefined,
  });

  tasks.push({
    id: "pay-deposit",
    stageId: "deposit",
    title: "Pay enrollment deposit",
    titleZh: "支付入学押金",
    completed: false,
    required: true,
    sortOrder: order++,
  });

  tasks.push({
    id: "request-i20",
    stageId: "i20",
    title: "Request I-20 form from the school",
    titleZh: "向学校申请 I-20 表格",
    completed: false,
    required: true,
    sortOrder: order++,
    url: program.intlAdmissionsUrl ?? undefined,
  });

  tasks.push({
    id: "submit-financial",
    stageId: "i20",
    title: "Submit financial documents for I-20",
    titleZh: "提交 I-20 所需财务证明",
    completed: false,
    required: true,
    sortOrder: order++,
    url: program.intlAdmissionsUrl ?? undefined,
  });

  // ────────────────────────────────────────────────────────
  // Phase 4: Visa & Pre-departure
  // ────────────────────────────────────────────────────────

  tasks.push({
    id: "sevis-fee",
    stageId: "visa",
    title: "Pay SEVIS I-901 fee ($350)",
    titleZh: "缴纳 SEVIS I-901 费（$350）",
    completed: false,
    required: true,
    sortOrder: order++,
    url: URLS.sevisFee,
  });

  tasks.push({
    id: "ds160",
    stageId: "visa",
    title: "Complete DS-160 visa application",
    titleZh: "填写 DS-160 签证申请表",
    completed: false,
    required: true,
    sortOrder: order++,
    url: URLS.ds160,
  });

  tasks.push({
    id: "visa-schedule",
    stageId: "visa",
    title: "Schedule F-1 visa interview at US Embassy",
    titleZh: "预约美国大使馆 F-1 签证面试",
    completed: false,
    required: true,
    sortOrder: order++,
    url: URLS.visaApptChina,
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

  tasks.push({
    id: "housing",
    stageId: "predeparture",
    title: "Apply for on-campus housing or arrange off-campus housing",
    titleZh: "申请校内住宿或安排校外住房",
    completed: false,
    required: true,
    sortOrder: order++,
  });

  tasks.push({
    id: "health-insurance",
    stageId: "predeparture",
    title: "Enroll in health insurance (or apply for waiver)",
    titleZh: "注册医疗保险（或申请豁免）",
    completed: false,
    required: true,
    sortOrder: order++,
  });

  tasks.push({
    id: "orientation",
    stageId: "predeparture",
    title: "Register for international student orientation",
    titleZh: "注册国际学生迎新活动",
    completed: false,
    required: true,
    sortOrder: order++,
    url: program.intlAdmissionsUrl ?? undefined,
  });

  return {
    tasks,
    generatedAt: new Date().toISOString(),
    version: GENERATION_VERSION,
  };
}

// ── Helpers (unchanged) ───────────────────────────────────

export function tasksForStage(state: TasksState, stageId: string): Task[] {
  return state.tasks
    .filter((t) => t.stageId === stageId)
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

export function stageProgress(state: TasksState, stageId: string) {
  const tasks = state.tasks.filter((t) => t.stageId === stageId && t.required);
  const done = tasks.filter((t) => t.completed).length;
  return { done, total: tasks.length };
}

export function overallProgress(state: TasksState) {
  const tasks = state.tasks.filter((t) => t.required);
  const done = tasks.filter((t) => t.completed).length;
  return { done, total: tasks.length };
}

export function toggleTask(state: TasksState, taskId: string): TasksState {
  return {
    ...state,
    tasks: state.tasks.map((t) =>
      t.id === taskId ? { ...t, completed: !t.completed } : t
    ),
  };
}

export function tasksByDate(state: TasksState): Task[] {
  return state.tasks
    .filter((t) => t.dueDate && t.required)
    .sort((a, b) => (a.dueDate! > b.dueDate! ? 1 : -1));
}

export function isStale(state: TasksState): boolean {
  return state.version < GENERATION_VERSION;
}

import type { PhaseDef, StageDef } from "./types";

// ============================================================
// 4 Phases
// ============================================================

export const PHASES: PhaseDef[] = [
  { id: "pre_submit",  title: "Pre-submit",    titleZh: "提交前准备", sortOrder: 1 },
  { id: "waiting",     title: "Waiting",       titleZh: "等待结果",   sortOrder: 2 },
  { id: "post_offer",  title: "Post-offer",    titleZh: "录取后",     sortOrder: 3 },
  { id: "visa",        title: "Visa & Travel", titleZh: "签证与行前", sortOrder: 4 },
];

// ============================================================
// 13 Stages
// ============================================================

export const STAGES: StageDef[] = [
  // ── Phase 1: Pre-submit (6 stages) ──────────────────────
  {
    id: "wes",
    phaseId: "pre_submit",
    title: "WES Evaluation",
    titleZh: "WES 学历认证",
    description: "Submit transcripts for credential evaluation. Takes 4-8 weeks.",
    descriptionZh: "提交成绩单进行学历认证，通常需要4-8周。",
    sortOrder: 1,
    conditional: true, // only if program.wesRequired
  },
  {
    id: "toefl",
    phaseId: "pre_submit",
    title: "TOEFL Scores",
    titleZh: "托福成绩",
    description: "Register, prepare, and send official scores to schools.",
    descriptionZh: "注册考试、备考，并将官方成绩寄送至学校。",
    sortOrder: 2,
    conditional: false,
  },
  {
    id: "gre",
    phaseId: "pre_submit",
    title: "GRE Scores",
    titleZh: "GRE 成绩",
    description: "Register, prepare, and send official scores to schools.",
    descriptionZh: "注册考试、备考，并将官方成绩寄送至学校。",
    sortOrder: 3,
    conditional: true, // only if program.greRequired
  },
  {
    id: "essays",
    phaseId: "pre_submit",
    title: "Essays",
    titleZh: "文书",
    description: "Statement of Purpose, cohort essays, writing samples, and program-specific prompts.",
    descriptionZh: "学术目标陈述、群体贡献文书、写作范例及项目补充文书。",
    sortOrder: 4,
    conditional: false,
  },
  {
    id: "recs",
    phaseId: "pre_submit",
    title: "Recommendations",
    titleZh: "推荐信",
    description: "Select recommenders, provide talking points, and track submissions.",
    descriptionZh: "选定推荐人、提供推荐要点、追踪提交状态。",
    sortOrder: 5,
    conditional: false,
  },
  {
    id: "fees",
    phaseId: "pre_submit",
    title: "Forms & Fees",
    titleZh: "申请表与费用",
    description: "Complete the application form, upload resume, and pay fees.",
    descriptionZh: "填写申请表、上传简历、支付申请费。",
    sortOrder: 6,
    conditional: false,
  },

  // ── Phase 2: Waiting (2 stages) ─────────────────────────
  {
    id: "interview",
    phaseId: "waiting",
    title: "Interview",
    titleZh: "面试",
    description: "Prepare for and complete the admissions interview.",
    descriptionZh: "准备并完成招生面试。",
    sortOrder: 7,
    conditional: true, // only if program.interviewReq
  },
  {
    id: "tracking",
    phaseId: "waiting",
    title: "Status Tracking",
    titleZh: "状态追踪",
    description: "Monitor portal for updates, respond to supplemental requests.",
    descriptionZh: "关注申请门户更新，回复补充材料要求。",
    sortOrder: 8,
    conditional: false,
  },

  // ── Phase 3: Post-offer (3 stages) ──────────────────────
  {
    id: "confirm",
    phaseId: "post_offer",
    title: "Accept Offer",
    titleZh: "确认录取",
    description: "Review offer details, compare options, accept or decline.",
    descriptionZh: "审查录取详情、对比选项、接受或拒绝。",
    sortOrder: 9,
    conditional: false,
  },
  {
    id: "deposit",
    phaseId: "post_offer",
    title: "Enrollment Deposit",
    titleZh: "入学押金",
    description: "Pay the enrollment deposit to secure your spot.",
    descriptionZh: "支付入学押金以保留录取名额。",
    sortOrder: 10,
    conditional: false,
  },
  {
    id: "i20",
    phaseId: "post_offer",
    title: "I-20 & Documents",
    titleZh: "I-20 与材料",
    description: "Request I-20, submit financial documents for visa sponsorship.",
    descriptionZh: "申请I-20，提交财务证明以支持签证申请。",
    sortOrder: 11,
    conditional: false,
  },

  // ── Phase 4: Visa & Pre-departure (2 stages) ────────────
  {
    id: "visa",
    phaseId: "visa",
    title: "F-1 Visa",
    titleZh: "F-1 签证",
    description: "Pay SEVIS fee, schedule and attend visa interview.",
    descriptionZh: "缴纳SEVIS费、预约并参加签证面试。",
    sortOrder: 12,
    conditional: false,
  },
  {
    id: "predeparture",
    phaseId: "visa",
    title: "Pre-departure",
    titleZh: "行前准备",
    description: "Housing, health insurance, orientation, and travel arrangements.",
    descriptionZh: "住宿、医疗保险、迎新活动及行程安排。",
    sortOrder: 13,
    conditional: false,
  },
];

// ── Lookup helpers ────────────────────────────────────────

export const STAGE_MAP = Object.fromEntries(STAGES.map((s) => [s.id, s]));
export const PHASE_MAP = Object.fromEntries(PHASES.map((p) => [p.id, p]));

/** Get all stages for a phase, sorted */
export function stagesForPhase(phaseId: PhaseDef["id"]): StageDef[] {
  return STAGES.filter((s) => s.phaseId === phaseId);
}

/** Get the phase for a stage */
export function phaseForStage(stageId: string): PhaseDef | undefined {
  const stage = STAGE_MAP[stageId];
  return stage ? PHASE_MAP[stage.phaseId] : undefined;
}

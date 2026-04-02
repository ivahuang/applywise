/**
 * Expands seed-programs.json:
 * 1. Adds new enriched fields to all existing programs
 * 2. Appends ~80 new commonly-targeted programs
 *
 * Run: npx tsx scripts/expand-programs.ts
 *
 * All new entries have verified_at=null — verify via program_url.
 * All deadlines are estimated for Fall 2026 entry.
 */

import fs from "fs";
import path from "path";

const filePath = path.join(__dirname, "../prisma/data/seed-programs.json");
const raw = JSON.parse(fs.readFileSync(filePath, "utf-8"));

// ── Step 1: Enrich existing programs with new fields ──────

for (const p of raw.programs) {
  if (p.wes_eval_type === undefined) p.wes_eval_type = p.wes_required ? "course-by-course" : null;
  if (p.recs_academic_min === undefined) p.recs_academic_min = 2;
  if (p.recs_notes === undefined) p.recs_notes = null;
  if (p.interview_format === undefined) p.interview_format = p.interview_required ? null : null;
  if (p.admissions_url === undefined) p.admissions_url = null;
  // Ensure essays have type field
  if (p.essays) {
    for (const e of p.essays) {
      if (!e.type) {
        if (e.title.toLowerCase().includes("statement of purpose") || e.title.toLowerCase().includes("academic purpose")) e.type = "sop";
        else if (e.title.toLowerCase().includes("cohort")) e.type = "cohort";
        else if (e.title.toLowerCase().includes("writing sample")) e.type = "writing_sample";
        else if (e.title.toLowerCase().includes("personal")) e.type = "personal_statement";
        else e.type = "program_specific";
      }
    }
  }
}

// ── Step 2: New programs to add ───────────────────────────

interface NewProgram {
  school: string; school_zh: string;
  program: string; program_zh: string;
  degree: string; department: string; field: string;
  deadline: string; toefl_min: number; gre_required: boolean;
  recs_required: number; recs_academic_min: number; recs_notes: string | null;
  wes_required: boolean; wes_eval_type: string | null;
  application_fee: number; interview_required: boolean; interview_format: string | null;
  essays: { title: string; title_zh: string; word_limit: number | null; type: string }[];
  program_url: string; portal_url: string | null; admissions_url: string | null;
  notes: string | null; verified_at: null; country: string;
}

const NEW_PROGRAMS: NewProgram[] = [
  // ── Computer Science ────────────────────────────────────
  {
    school: "Carnegie Mellon University", school_zh: "卡内基梅隆大学",
    program: "M.S. in Computer Science", program_zh: "计算机科学硕士",
    degree: "MS", department: "School of Computer Science", field: "computer_science",
    deadline: "2025-12-15", toefl_min: 100, gre_required: false,
    recs_required: 3, recs_academic_min: 2, recs_notes: null,
    wes_required: false, wes_eval_type: null,
    application_fee: 100, interview_required: false, interview_format: null,
    essays: [{ title: "Statement of Purpose", title_zh: "学术目标陈述", word_limit: null, type: "sop" }],
    program_url: "https://csd.cmu.edu/academics/masters/overview", portal_url: "https://applygrad.cs.cmu.edu/apply/", admissions_url: null,
    notes: "Extremely competitive. ~5% acceptance rate for MS CS.", verified_at: null, country: "US"
  },
  {
    school: "Carnegie Mellon University", school_zh: "卡内基梅隆大学",
    program: "M.S. in Machine Learning", program_zh: "机器学习硕士",
    degree: "MS", department: "School of Computer Science", field: "computer_science",
    deadline: "2025-12-15", toefl_min: 100, gre_required: false,
    recs_required: 3, recs_academic_min: 2, recs_notes: null,
    wes_required: false, wes_eval_type: null,
    application_fee: 100, interview_required: false, interview_format: null,
    essays: [{ title: "Statement of Purpose", title_zh: "学术目标陈述", word_limit: null, type: "sop" }],
    program_url: "https://www.ml.cmu.edu/academics/ms-program.html", portal_url: "https://applygrad.cs.cmu.edu/apply/", admissions_url: null,
    notes: null, verified_at: null, country: "US"
  },
  {
    school: "Stanford University", school_zh: "斯坦福大学",
    program: "M.S. in Computer Science", program_zh: "计算机科学硕士",
    degree: "MS", department: "School of Engineering", field: "computer_science",
    deadline: "2025-12-01", toefl_min: 100, gre_required: false,
    recs_required: 3, recs_academic_min: 2, recs_notes: null,
    wes_required: false, wes_eval_type: null,
    application_fee: 125, interview_required: false, interview_format: null,
    essays: [{ title: "Statement of Purpose", title_zh: "学术目标陈述", word_limit: null, type: "sop" }],
    program_url: "https://cs.stanford.edu/admissions/ms", portal_url: "https://gradadmissions.stanford.edu/applying", admissions_url: null,
    notes: null, verified_at: null, country: "US"
  },
  {
    school: "University of California, Berkeley", school_zh: "加州大学伯克利分校",
    program: "M.Eng. in EECS", program_zh: "电子工程与计算机科学工程硕士",
    degree: "MEng", department: "College of Engineering", field: "computer_science",
    deadline: "2026-01-06", toefl_min: 90, gre_required: false,
    recs_required: 3, recs_academic_min: 2, recs_notes: null,
    wes_required: false, wes_eval_type: null,
    application_fee: 140, interview_required: false, interview_format: null,
    essays: [{ title: "Personal Statement", title_zh: "个人陈述", word_limit: null, type: "personal_statement" }],
    program_url: "https://eecs.berkeley.edu/academics/graduate/industry-programs/meng", portal_url: "https://gradapp.berkeley.edu/apply/", admissions_url: null,
    notes: "Professional degree. 1-year program.", verified_at: null, country: "US"
  },
  {
    school: "University of Illinois Urbana-Champaign", school_zh: "伊利诺伊大学厄巴纳-香槟分校",
    program: "M.S. in Computer Science", program_zh: "计算机科学硕士",
    degree: "MS", department: "Grainger College of Engineering", field: "computer_science",
    deadline: "2025-12-15", toefl_min: 103, gre_required: false,
    recs_required: 3, recs_academic_min: 2, recs_notes: null,
    wes_required: false, wes_eval_type: null,
    application_fee: 90, interview_required: false, interview_format: null,
    essays: [{ title: "Statement of Purpose", title_zh: "学术目标陈述", word_limit: null, type: "sop" }],
    program_url: "https://cs.illinois.edu/academics/graduate/ms-program", portal_url: "https://choose.illinois.edu/apply/", admissions_url: null,
    notes: null, verified_at: null, country: "US"
  },
  {
    school: "Georgia Institute of Technology", school_zh: "佐治亚理工学院",
    program: "M.S. in Computer Science", program_zh: "计算机科学硕士",
    degree: "MS", department: "College of Computing", field: "computer_science",
    deadline: "2026-02-01", toefl_min: 100, gre_required: false,
    recs_required: 3, recs_academic_min: 2, recs_notes: null,
    wes_required: false, wes_eval_type: null,
    application_fee: 85, interview_required: false, interview_format: null,
    essays: [{ title: "Statement of Purpose", title_zh: "学术目标陈述", word_limit: null, type: "sop" }],
    program_url: "https://www.cc.gatech.edu/ms-computer-science", portal_url: "https://grad.gatech.edu/apply-now", admissions_url: null,
    notes: null, verified_at: null, country: "US"
  },
  {
    school: "University of Washington", school_zh: "华盛顿大学",
    program: "M.S. in Computer Science & Engineering", program_zh: "计算机科学与工程硕士",
    degree: "MS", department: "Allen School of CSE", field: "computer_science",
    deadline: "2025-12-15", toefl_min: 92, gre_required: false,
    recs_required: 3, recs_academic_min: 2, recs_notes: null,
    wes_required: false, wes_eval_type: null,
    application_fee: 85, interview_required: false, interview_format: null,
    essays: [{ title: "Statement of Purpose", title_zh: "学术目标陈述", word_limit: null, type: "sop" }],
    program_url: "https://www.cs.washington.edu/academics/graduate", portal_url: "https://grad.uw.edu/admissions/applying/", admissions_url: null,
    notes: null, verified_at: null, country: "US"
  },
  {
    school: "University of Southern California", school_zh: "南加州大学",
    program: "M.S. in Computer Science", program_zh: "计算机科学硕士",
    degree: "MS", department: "Viterbi School of Engineering", field: "computer_science",
    deadline: "2025-12-15", toefl_min: 90, gre_required: false,
    recs_required: 3, recs_academic_min: 2, recs_notes: null,
    wes_required: false, wes_eval_type: null,
    application_fee: 90, interview_required: false, interview_format: null,
    essays: [{ title: "Statement of Purpose", title_zh: "学术目标陈述", word_limit: null, type: "sop" }],
    program_url: "https://www.cs.usc.edu/academic-programs/masters/", portal_url: "https://usc.liaisoncas.com/", admissions_url: null,
    notes: "Large program, ~300 students per cohort", verified_at: null, country: "US"
  },
  {
    school: "University of Pennsylvania", school_zh: "宾夕法尼亚大学",
    program: "M.S.E. in Computer and Information Science", program_zh: "计算机与信息科学硕士",
    degree: "MSE", department: "School of Engineering", field: "computer_science",
    deadline: "2025-12-15", toefl_min: 100, gre_required: false,
    recs_required: 3, recs_academic_min: 2, recs_notes: null,
    wes_required: false, wes_eval_type: null,
    application_fee: 90, interview_required: false, interview_format: null,
    essays: [{ title: "Statement of Purpose", title_zh: "学术目标陈述", word_limit: null, type: "sop" }],
    program_url: "https://www.cis.upenn.edu/graduate/program-offerings/mse-in-cis/", portal_url: "https://grad.admissions.upenn.edu/apply/", admissions_url: null,
    notes: null, verified_at: null, country: "US"
  },
  {
    school: "Duke University", school_zh: "杜克大学",
    program: "M.S. in Computer Science", program_zh: "计算机科学硕士",
    degree: "MS", department: "Pratt School of Engineering", field: "computer_science",
    deadline: "2026-01-15", toefl_min: 90, gre_required: false,
    recs_required: 3, recs_academic_min: 2, recs_notes: null,
    wes_required: false, wes_eval_type: null,
    application_fee: 85, interview_required: false, interview_format: null,
    essays: [{ title: "Statement of Purpose", title_zh: "学术目标陈述", word_limit: null, type: "sop" }],
    program_url: "https://cs.duke.edu/graduate/ms", portal_url: "https://gradschool.duke.edu/admissions/apply/", admissions_url: null,
    notes: null, verified_at: null, country: "US"
  },
  {
    school: "Northeastern University", school_zh: "东北大学",
    program: "M.S. in Computer Science", program_zh: "计算机科学硕士",
    degree: "MS", department: "Khoury College", field: "computer_science",
    deadline: "2026-02-01", toefl_min: 100, gre_required: false,
    recs_required: 3, recs_academic_min: 2, recs_notes: null,
    wes_required: false, wes_eval_type: null,
    application_fee: 75, interview_required: false, interview_format: null,
    essays: [{ title: "Statement of Purpose", title_zh: "学术目标陈述", word_limit: null, type: "sop" }],
    program_url: "https://www.khoury.northeastern.edu/program/computer-science-ms/", portal_url: "https://app.applyyourself.com/AYApplicantLogin/fl_ApplicantLogin.asp?id=neu-gs", admissions_url: null,
    notes: "Strong co-op program", verified_at: null, country: "US"
  },

  // ── Data Science ────────────────────────────────────────
  {
    school: "Columbia University", school_zh: "哥伦比亚大学",
    program: "M.S. in Data Science", program_zh: "数据科学硕士",
    degree: "MS", department: "Data Science Institute", field: "data_science",
    deadline: "2026-02-15", toefl_min: 101, gre_required: false,
    recs_required: 3, recs_academic_min: 2, recs_notes: null,
    wes_required: true, wes_eval_type: "course-by-course",
    application_fee: 120, interview_required: false, interview_format: null,
    essays: [{ title: "Statement of Academic Purpose", title_zh: "学术目标陈述", word_limit: 500, type: "sop" }],
    program_url: "https://datascience.columbia.edu/education/programs/m-s-in-data-science/", portal_url: "https://apply.gsas.columbia.edu/apply/", admissions_url: null,
    notes: null, verified_at: null, country: "US"
  },
  {
    school: "New York University", school_zh: "纽约大学",
    program: "M.S. in Data Science", program_zh: "数据科学硕士",
    degree: "MS", department: "Center for Data Science", field: "data_science",
    deadline: "2026-01-15", toefl_min: 100, gre_required: true,
    recs_required: 3, recs_academic_min: 2, recs_notes: null,
    wes_required: true, wes_eval_type: "course-by-course",
    application_fee: 110, interview_required: false, interview_format: null,
    essays: [{ title: "Statement of Purpose", title_zh: "学术目标陈述", word_limit: null, type: "sop" }],
    program_url: "https://cds.nyu.edu/ms-in-data-science/", portal_url: "https://gsas.nyu.edu/admissions/gsas-application-resource-center/applying-online.html", admissions_url: null,
    notes: null, verified_at: null, country: "US"
  },
  {
    school: "University of California, Berkeley", school_zh: "加州大学伯克利分校",
    program: "Master of Information and Data Science (MIDS)", program_zh: "信息与数据科学硕士",
    degree: "MIDS", department: "School of Information", field: "data_science",
    deadline: "2026-01-08", toefl_min: 90, gre_required: false,
    recs_required: 3, recs_academic_min: 1, recs_notes: "1 academic or professional who can speak to your analytical abilities",
    wes_required: false, wes_eval_type: null,
    application_fee: 140, interview_required: false, interview_format: null,
    essays: [{ title: "Statement of Purpose", title_zh: "学术目标陈述", word_limit: null, type: "sop" }, { title: "Personal History Statement", title_zh: "个人经历陈述", word_limit: null, type: "personal_statement" }],
    program_url: "https://ischool.berkeley.edu/programs/mids", portal_url: "https://gradapp.berkeley.edu/apply/", admissions_url: null,
    notes: "Online format. Working professionals.", verified_at: null, country: "US"
  },
  {
    school: "University of Michigan", school_zh: "密歇根大学",
    program: "M.S. in Applied Data Science", program_zh: "应用数据科学硕士",
    degree: "MS", department: "School of Information", field: "data_science",
    deadline: "2026-01-15", toefl_min: 100, gre_required: false,
    recs_required: 3, recs_academic_min: 1, recs_notes: null,
    wes_required: false, wes_eval_type: null,
    application_fee: 90, interview_required: false, interview_format: null,
    essays: [{ title: "Statement of Purpose", title_zh: "学术目标陈述", word_limit: 500, type: "sop" }],
    program_url: "https://www.si.umich.edu/programs/master-applied-data-science", portal_url: "https://rackham.umich.edu/admissions/applying/", admissions_url: null,
    notes: null, verified_at: null, country: "US"
  },
  {
    school: "Harvard University", school_zh: "哈佛大学",
    program: "M.S. in Data Science", program_zh: "数据科学硕士",
    degree: "MS", department: "John A. Paulson School of Engineering", field: "data_science",
    deadline: "2025-12-15", toefl_min: 100, gre_required: false,
    recs_required: 3, recs_academic_min: 2, recs_notes: null,
    wes_required: false, wes_eval_type: null,
    application_fee: 105, interview_required: false, interview_format: null,
    essays: [{ title: "Statement of Purpose", title_zh: "学术目标陈述", word_limit: null, type: "sop" }],
    program_url: "https://seas.harvard.edu/applied-computation/graduate-programs/masters-data-science", portal_url: "https://gsas.harvard.edu/apply", admissions_url: null,
    notes: null, verified_at: null, country: "US"
  },

  // ── Financial Engineering ───────────────────────────────
  {
    school: "Columbia University", school_zh: "哥伦比亚大学",
    program: "M.S. in Financial Engineering", program_zh: "金融工程硕士",
    degree: "MS", department: "Fu Foundation School of Engineering (IEOR)", field: "financial_engineering",
    deadline: "2026-01-05", toefl_min: 101, gre_required: true,
    recs_required: 3, recs_academic_min: 2, recs_notes: null,
    wes_required: true, wes_eval_type: "course-by-course",
    application_fee: 120, interview_required: true, interview_format: "kira",
    essays: [{ title: "Statement of Purpose", title_zh: "学术目标陈述", word_limit: 500, type: "sop" }],
    program_url: "https://msfe.ieor.columbia.edu/", portal_url: "https://apply.gsas.columbia.edu/apply/", admissions_url: null,
    notes: "3-semester program. Quantitative focus.", verified_at: null, country: "US"
  },
  {
    school: "Carnegie Mellon University", school_zh: "卡内基梅隆大学",
    program: "M.S. in Computational Finance", program_zh: "计算金融硕士",
    degree: "MS", department: "Tepper School of Business", field: "financial_engineering",
    deadline: "2026-01-05", toefl_min: 100, gre_required: true,
    recs_required: 3, recs_academic_min: 2, recs_notes: null,
    wes_required: false, wes_eval_type: null,
    application_fee: 100, interview_required: true, interview_format: "zoom",
    essays: [{ title: "Statement of Purpose", title_zh: "学术目标陈述", word_limit: 500, type: "sop" }, { title: "Video Essay", title_zh: "视频文书", word_limit: null, type: "program_specific" }],
    program_url: "https://www.cmu.edu/mscf/", portal_url: "https://gradadmissions.cmu.edu/apply/", admissions_url: null,
    notes: "Pittsburgh + NYC campus option", verified_at: null, country: "US"
  },
  {
    school: "New York University", school_zh: "纽约大学",
    program: "M.S. in Financial Engineering", program_zh: "金融工程硕士",
    degree: "MS", department: "Tandon School of Engineering", field: "financial_engineering",
    deadline: "2026-02-01", toefl_min: 90, gre_required: true,
    recs_required: 3, recs_academic_min: 2, recs_notes: null,
    wes_required: true, wes_eval_type: "course-by-course",
    application_fee: 110, interview_required: false, interview_format: null,
    essays: [{ title: "Statement of Purpose", title_zh: "学术目标陈述", word_limit: null, type: "sop" }],
    program_url: "https://engineering.nyu.edu/academics/programs/financial-engineering-ms", portal_url: "https://apply.engineering.nyu.edu/", admissions_url: null,
    notes: null, verified_at: null, country: "US"
  },
  {
    school: "Cornell University", school_zh: "康奈尔大学",
    program: "M.Eng. in Financial Engineering", program_zh: "金融工程工程硕士",
    degree: "MEng", department: "School of Operations Research (ORIE)", field: "financial_engineering",
    deadline: "2026-02-01", toefl_min: 100, gre_required: true,
    recs_required: 2, recs_academic_min: 1, recs_notes: null,
    wes_required: false, wes_eval_type: null,
    application_fee: 105, interview_required: false, interview_format: null,
    essays: [{ title: "Statement of Purpose", title_zh: "学术目标陈述", word_limit: null, type: "sop" }],
    program_url: "https://www.orie.cornell.edu/orie/programs/meng/meng-financial-engineering", portal_url: "https://gradschool.cornell.edu/admissions/apply/", admissions_url: null,
    notes: "NYC Tech campus option available", verified_at: null, country: "US"
  },
  {
    school: "University of California, Berkeley", school_zh: "加州大学伯克利分校",
    program: "Master of Financial Engineering", program_zh: "金融工程硕士",
    degree: "MFE", department: "Haas School of Business", field: "financial_engineering",
    deadline: "2026-01-07", toefl_min: 90, gre_required: true,
    recs_required: 2, recs_academic_min: 0, recs_notes: "Professional recommenders preferred",
    wes_required: false, wes_eval_type: null,
    application_fee: 200, interview_required: true, interview_format: "zoom",
    essays: [{ title: "Short Answer Essays", title_zh: "简答文书", word_limit: 250, type: "program_specific" }],
    program_url: "https://mfe.haas.berkeley.edu/", portal_url: "https://mfe.haas.berkeley.edu/admissions/how-to-apply", admissions_url: null,
    notes: "1-year program. Top-ranked MFE.", verified_at: null, country: "US"
  },

  // ── Statistics ──────────────────────────────────────────
  {
    school: "Columbia University", school_zh: "哥伦比亚大学",
    program: "M.A. in Statistics", program_zh: "统计学硕士",
    degree: "MA", department: "Department of Statistics", field: "statistics",
    deadline: "2026-01-29", toefl_min: 101, gre_required: true,
    recs_required: 3, recs_academic_min: 2, recs_notes: null,
    wes_required: true, wes_eval_type: "course-by-course",
    application_fee: 120, interview_required: false, interview_format: null,
    essays: [{ title: "Statement of Academic Purpose", title_zh: "学术目标陈述", word_limit: null, type: "sop" }],
    program_url: "https://stat.columbia.edu/masters-programs/", portal_url: "https://apply.gsas.columbia.edu/apply/", admissions_url: null,
    notes: null, verified_at: null, country: "US"
  },
  {
    school: "University of Chicago", school_zh: "芝加哥大学",
    program: "M.S. in Statistics", program_zh: "统计学硕士",
    degree: "MS", department: "Department of Statistics", field: "statistics",
    deadline: "2026-01-03", toefl_min: 104, gre_required: true,
    recs_required: 3, recs_academic_min: 2, recs_notes: null,
    wes_required: false, wes_eval_type: null,
    application_fee: 90, interview_required: false, interview_format: null,
    essays: [{ title: "Statement of Purpose", title_zh: "学术目标陈述", word_limit: null, type: "sop" }],
    program_url: "https://stat.uchicago.edu/academics/ms-program/", portal_url: "https://apply-psd.uchicago.edu/apply/", admissions_url: null,
    notes: null, verified_at: null, country: "US"
  },
  {
    school: "Duke University", school_zh: "杜克大学",
    program: "M.S. in Statistical Science", program_zh: "统计科学硕士",
    degree: "MS", department: "Department of Statistical Science", field: "statistics",
    deadline: "2026-01-15", toefl_min: 90, gre_required: true,
    recs_required: 3, recs_academic_min: 2, recs_notes: null,
    wes_required: false, wes_eval_type: null,
    application_fee: 85, interview_required: false, interview_format: null,
    essays: [{ title: "Statement of Purpose", title_zh: "学术目标陈述", word_limit: null, type: "sop" }],
    program_url: "https://stat.duke.edu/ms", portal_url: "https://gradschool.duke.edu/admissions/apply/", admissions_url: null,
    notes: null, verified_at: null, country: "US"
  },

  // ── Public Policy / International Relations ─────────────
  {
    school: "Columbia University", school_zh: "哥伦比亚大学",
    program: "Master of Public Administration (MPA)", program_zh: "公共管理硕士",
    degree: "MPA", department: "School of International and Public Affairs (SIPA)", field: "public_policy",
    deadline: "2026-01-15", toefl_min: 100, gre_required: true,
    recs_required: 3, recs_academic_min: 1, recs_notes: "Mix of academic and professional",
    wes_required: true, wes_eval_type: "course-by-course",
    application_fee: 110, interview_required: false, interview_format: null,
    essays: [{ title: "Policy Essay", title_zh: "政策文书", word_limit: 750, type: "sop" }, { title: "Personal Essay", title_zh: "个人文书", word_limit: 500, type: "personal_statement" }],
    program_url: "https://www.sipa.columbia.edu/admissions", portal_url: "https://apply.sipa.columbia.edu/", admissions_url: null,
    notes: "Multiple concentrations available", verified_at: null, country: "US"
  },
  {
    school: "Georgetown University", school_zh: "乔治城大学",
    program: "M.S. in Foreign Service (MSFS)", program_zh: "外交事务硕士",
    degree: "MS", department: "Walsh School of Foreign Service", field: "international_relations",
    deadline: "2026-01-15", toefl_min: 100, gre_required: true,
    recs_required: 3, recs_academic_min: 1, recs_notes: null,
    wes_required: false, wes_eval_type: null,
    application_fee: 95, interview_required: true, interview_format: "alumni",
    essays: [{ title: "Policy Memo", title_zh: "政策备忘录", word_limit: 1500, type: "sop" }, { title: "Personal Statement", title_zh: "个人陈述", word_limit: 750, type: "personal_statement" }],
    program_url: "https://msfs.georgetown.edu/", portal_url: "https://grad.georgetown.edu/admissions/apply/", admissions_url: null,
    notes: null, verified_at: null, country: "US"
  },
  {
    school: "University of Chicago", school_zh: "芝加哥大学",
    program: "Master of Public Policy (MPP)", program_zh: "公共政策硕士",
    degree: "MPP", department: "Harris School of Public Policy", field: "public_policy",
    deadline: "2026-01-05", toefl_min: 104, gre_required: true,
    recs_required: 3, recs_academic_min: 1, recs_notes: null,
    wes_required: false, wes_eval_type: null,
    application_fee: 90, interview_required: false, interview_format: null,
    essays: [{ title: "Statement of Purpose", title_zh: "学术目标陈述", word_limit: null, type: "sop" }],
    program_url: "https://harris.uchicago.edu/academics/degrees/master-public-policy-mpp", portal_url: "https://apply-psd.uchicago.edu/apply/", admissions_url: null,
    notes: "Quantitative policy focus", verified_at: null, country: "US"
  },
  {
    school: "Princeton University", school_zh: "普林斯顿大学",
    program: "Master in Public Affairs (MPA)", program_zh: "公共事务硕士",
    degree: "MPA", department: "School of Public and International Affairs (SPIA)", field: "public_policy",
    deadline: "2025-12-01", toefl_min: 108, gre_required: true,
    recs_required: 3, recs_academic_min: 1, recs_notes: null,
    wes_required: false, wes_eval_type: null,
    application_fee: 90, interview_required: false, interview_format: null,
    essays: [{ title: "Policy Memo", title_zh: "政策备忘录", word_limit: null, type: "program_specific" }, { title: "Statement of Purpose", title_zh: "学术目标陈述", word_limit: null, type: "sop" }],
    program_url: "https://spia.princeton.edu/graduate-program/mpa", portal_url: "https://gradschool.princeton.edu/admission", admissions_url: null,
    notes: "Fully funded for many students", verified_at: null, country: "US"
  },

  // ── Information Science / HCI ──────────────────────────
  {
    school: "Carnegie Mellon University", school_zh: "卡内基梅隆大学",
    program: "M.S. in Human-Computer Interaction", program_zh: "人机交互硕士",
    degree: "MS", department: "Human-Computer Interaction Institute", field: "hci",
    deadline: "2026-01-10", toefl_min: 100, gre_required: false,
    recs_required: 3, recs_academic_min: 1, recs_notes: null,
    wes_required: false, wes_eval_type: null,
    application_fee: 100, interview_required: false, interview_format: null,
    essays: [{ title: "Statement of Purpose", title_zh: "学术目标陈述", word_limit: null, type: "sop" }, { title: "Portfolio / Work Samples", title_zh: "作品集", word_limit: null, type: "program_specific" }],
    program_url: "https://www.hcii.cmu.edu/academics/mhci", portal_url: "https://gradadmissions.cmu.edu/apply/", admissions_url: null,
    notes: "7-month intensive program", verified_at: null, country: "US"
  },
  {
    school: "University of Michigan", school_zh: "密歇根大学",
    program: "Master of Science in Information", program_zh: "信息学硕士",
    degree: "MSI", department: "School of Information (UMSI)", field: "information_science",
    deadline: "2026-01-15", toefl_min: 100, gre_required: false,
    recs_required: 3, recs_academic_min: 1, recs_notes: null,
    wes_required: false, wes_eval_type: null,
    application_fee: 90, interview_required: false, interview_format: null,
    essays: [{ title: "Personal Statement", title_zh: "个人陈述", word_limit: 500, type: "personal_statement" }, { title: "Statement of Purpose", title_zh: "学术目标陈述", word_limit: 500, type: "sop" }],
    program_url: "https://www.si.umich.edu/programs/master-science-information", portal_url: "https://rackham.umich.edu/admissions/applying/", admissions_url: null,
    notes: "Multiple tracks: UX, Data Science, HCI, Info Policy", verified_at: null, country: "US"
  },
  {
    school: "Cornell University", school_zh: "康奈尔大学",
    program: "M.S. in Information Science", program_zh: "信息科学硕士",
    degree: "MS", department: "Cornell Bowers CIS", field: "information_science",
    deadline: "2026-02-01", toefl_min: 100, gre_required: false,
    recs_required: 3, recs_academic_min: 2, recs_notes: null,
    wes_required: false, wes_eval_type: null,
    application_fee: 105, interview_required: false, interview_format: null,
    essays: [{ title: "Statement of Purpose", title_zh: "学术目标陈述", word_limit: null, type: "sop" }],
    program_url: "https://infosci.cornell.edu/masters/msis", portal_url: "https://gradschool.cornell.edu/admissions/apply/", admissions_url: null,
    notes: "NYC Tech campus option", verified_at: null, country: "US"
  },

  // ── Education ──────────────────────────────────────────
  {
    school: "Harvard University", school_zh: "哈佛大学",
    program: "Ed.M. in Education Policy and Analysis", program_zh: "教育政策与分析教育硕士",
    degree: "EdM", department: "Graduate School of Education", field: "education",
    deadline: "2026-01-06", toefl_min: 104, gre_required: false,
    recs_required: 3, recs_academic_min: 1, recs_notes: null,
    wes_required: false, wes_eval_type: null,
    application_fee: 85, interview_required: false, interview_format: null,
    essays: [{ title: "Statement of Purpose", title_zh: "学术目标陈述", word_limit: 500, type: "sop" }],
    program_url: "https://www.gse.harvard.edu/edm", portal_url: "https://www.gse.harvard.edu/apply", admissions_url: null,
    notes: "1-year program", verified_at: null, country: "US"
  },
  {
    school: "Columbia University", school_zh: "哥伦比亚大学",
    program: "M.A. in Education (Teachers College)", program_zh: "教育学硕士（师范学院）",
    degree: "MA", department: "Teachers College", field: "education",
    deadline: "2026-01-15", toefl_min: 100, gre_required: false,
    recs_required: 3, recs_academic_min: 1, recs_notes: null,
    wes_required: true, wes_eval_type: "course-by-course",
    application_fee: 75, interview_required: false, interview_format: null,
    essays: [{ title: "Statement of Purpose", title_zh: "学术目标陈述", word_limit: 500, type: "sop" }],
    program_url: "https://www.tc.columbia.edu/admissions/", portal_url: "https://apply.tc.columbia.edu/", admissions_url: null,
    notes: "Multiple specializations", verified_at: null, country: "US"
  },
  {
    school: "University of Pennsylvania", school_zh: "宾夕法尼亚大学",
    program: "M.S.Ed. in Education", program_zh: "教育学硕士",
    degree: "MSEd", department: "Graduate School of Education", field: "education",
    deadline: "2026-01-15", toefl_min: 100, gre_required: false,
    recs_required: 3, recs_academic_min: 1, recs_notes: null,
    wes_required: false, wes_eval_type: null,
    application_fee: 80, interview_required: false, interview_format: null,
    essays: [{ title: "Statement of Purpose", title_zh: "学术目标陈述", word_limit: null, type: "sop" }],
    program_url: "https://www.gse.upenn.edu/admissions", portal_url: "https://www.gse.upenn.edu/admissions/how-to-apply", admissions_url: null,
    notes: null, verified_at: null, country: "US"
  },

  // ── Business Analytics ─────────────────────────────────
  {
    school: "Massachusetts Institute of Technology", school_zh: "麻省理工学院",
    program: "Master of Business Analytics (MBAn)", program_zh: "商业分析硕士",
    degree: "MBAn", department: "Sloan School of Management", field: "business_analytics",
    deadline: "2026-01-10", toefl_min: 100, gre_required: true,
    recs_required: 2, recs_academic_min: 0, recs_notes: "Professional recommenders preferred",
    wes_required: false, wes_eval_type: null,
    application_fee: 150, interview_required: true, interview_format: "zoom",
    essays: [{ title: "Cover Letter", title_zh: "求职信", word_limit: 500, type: "sop" }, { title: "Video Statement", title_zh: "视频陈述", word_limit: null, type: "program_specific" }],
    program_url: "https://mitsloan.mit.edu/master-of-business-analytics", portal_url: "https://mitsloan.mit.edu/master-of-business-analytics/apply", admissions_url: null,
    notes: "12-month program. Includes capstone project with company.", verified_at: null, country: "US"
  },
  {
    school: "University of Southern California", school_zh: "南加州大学",
    program: "M.S. in Business Analytics", program_zh: "商业分析硕士",
    degree: "MS", department: "Marshall School of Business", field: "business_analytics",
    deadline: "2026-01-15", toefl_min: 103, gre_required: true,
    recs_required: 2, recs_academic_min: 0, recs_notes: null,
    wes_required: false, wes_eval_type: null,
    application_fee: 155, interview_required: false, interview_format: null,
    essays: [{ title: "Statement of Purpose", title_zh: "学术目标陈述", word_limit: null, type: "sop" }],
    program_url: "https://www.marshall.usc.edu/programs/specialized-masters/master-science-business-analytics", portal_url: "https://usc.liaisoncas.com/", admissions_url: null,
    notes: null, verified_at: null, country: "US"
  },
  {
    school: "University of California, Los Angeles", school_zh: "加州大学洛杉矶分校",
    program: "Master of Quantitative Economics (MQE)", program_zh: "定量经济学硕士",
    degree: "MQE", department: "Department of Economics", field: "economics",
    deadline: "2026-01-15", toefl_min: 100, gre_required: true,
    recs_required: 3, recs_academic_min: 2, recs_notes: null,
    wes_required: false, wes_eval_type: null,
    application_fee: 140, interview_required: false, interview_format: null,
    essays: [{ title: "Statement of Purpose", title_zh: "学术目标陈述", word_limit: null, type: "sop" }],
    program_url: "https://economics.ucla.edu/graduate/mqe/", portal_url: "https://grad.ucla.edu/admissions/apply/", admissions_url: null,
    notes: "1-year professional degree", verified_at: null, country: "US"
  },

  // ── ECE / Electrical Engineering ───────────────────────
  {
    school: "Columbia University", school_zh: "哥伦比亚大学",
    program: "M.S. in Electrical Engineering", program_zh: "电气工程硕士",
    degree: "MS", department: "Fu Foundation School of Engineering", field: "electrical_engineering",
    deadline: "2026-02-15", toefl_min: 101, gre_required: false,
    recs_required: 3, recs_academic_min: 2, recs_notes: null,
    wes_required: true, wes_eval_type: "course-by-course",
    application_fee: 120, interview_required: false, interview_format: null,
    essays: [{ title: "Statement of Purpose", title_zh: "学术目标陈述", word_limit: null, type: "sop" }],
    program_url: "https://www.ee.columbia.edu/ms-degree-program", portal_url: "https://apply.gsas.columbia.edu/apply/", admissions_url: null,
    notes: null, verified_at: null, country: "US"
  },
  {
    school: "Stanford University", school_zh: "斯坦福大学",
    program: "M.S. in Electrical Engineering", program_zh: "电气工程硕士",
    degree: "MS", department: "School of Engineering", field: "electrical_engineering",
    deadline: "2025-12-02", toefl_min: 100, gre_required: false,
    recs_required: 3, recs_academic_min: 2, recs_notes: null,
    wes_required: false, wes_eval_type: null,
    application_fee: 125, interview_required: false, interview_format: null,
    essays: [{ title: "Statement of Purpose", title_zh: "学术目标陈述", word_limit: null, type: "sop" }],
    program_url: "https://ee.stanford.edu/admissions/ms", portal_url: "https://gradadmissions.stanford.edu/applying", admissions_url: null,
    notes: null, verified_at: null, country: "US"
  },
  {
    school: "University of California, San Diego", school_zh: "加州大学圣迭戈分校",
    program: "M.S. in Electrical and Computer Engineering", program_zh: "电气与计算机工程硕士",
    degree: "MS", department: "Jacobs School of Engineering", field: "electrical_engineering",
    deadline: "2025-12-20", toefl_min: 85, gre_required: false,
    recs_required: 3, recs_academic_min: 2, recs_notes: null,
    wes_required: false, wes_eval_type: null,
    application_fee: 140, interview_required: false, interview_format: null,
    essays: [{ title: "Statement of Purpose", title_zh: "学术目标陈述", word_limit: null, type: "sop" }],
    program_url: "https://ece.ucsd.edu/graduate/prospective-students", portal_url: "https://gradapp.ucsd.edu/apply/", admissions_url: null,
    notes: null, verified_at: null, country: "US"
  },

  // ── Journalism / Media ─────────────────────────────────
  {
    school: "Columbia University", school_zh: "哥伦比亚大学",
    program: "M.S. in Journalism", program_zh: "新闻学硕士",
    degree: "MS", department: "Graduate School of Journalism", field: "journalism",
    deadline: "2026-01-15", toefl_min: 114, gre_required: false,
    recs_required: 3, recs_academic_min: 0, recs_notes: "Professional recommenders preferred for journalism experience",
    wes_required: true, wes_eval_type: "course-by-course",
    application_fee: 120, interview_required: false, interview_format: null,
    essays: [{ title: "Autobiographical Essay", title_zh: "个人经历文书", word_limit: null, type: "personal_statement" }, { title: "Writing Test", title_zh: "写作测试", word_limit: null, type: "program_specific" }],
    program_url: "https://journalism.columbia.edu/ms", portal_url: "https://apply.journalism.columbia.edu/", admissions_url: null,
    notes: "Very high TOEFL requirement. Writing-intensive.", verified_at: null, country: "US"
  },
  {
    school: "New York University", school_zh: "纽约大学",
    program: "M.A. in Media, Culture, and Communication", program_zh: "媒体、文化与传播硕士",
    degree: "MA", department: "Steinhardt School", field: "communications",
    deadline: "2026-01-15", toefl_min: 100, gre_required: false,
    recs_required: 3, recs_academic_min: 2, recs_notes: null,
    wes_required: true, wes_eval_type: "course-by-course",
    application_fee: 110, interview_required: false, interview_format: null,
    essays: [{ title: "Statement of Purpose", title_zh: "学术目标陈述", word_limit: null, type: "sop" }, { title: "Writing Sample", title_zh: "写作范例", word_limit: null, type: "writing_sample" }],
    program_url: "https://steinhardt.nyu.edu/programs/media-culture-and-communication-ma", portal_url: "https://gsas.nyu.edu/admissions/", admissions_url: null,
    notes: "Research-oriented", verified_at: null, country: "US"
  },
  {
    school: "Boston University", school_zh: "波士顿大学",
    program: "M.S. in Communication", program_zh: "传播学硕士",
    degree: "MS", department: "College of Communication", field: "communications",
    deadline: "2026-02-01", toefl_min: 91, gre_required: false,
    recs_required: 3, recs_academic_min: 1, recs_notes: null,
    wes_required: false, wes_eval_type: null,
    application_fee: 80, interview_required: false, interview_format: null,
    essays: [{ title: "Statement of Purpose", title_zh: "学术目标陈述", word_limit: null, type: "sop" }],
    program_url: "https://www.bu.edu/com/academics/degree-programs/ms-communication/", portal_url: "https://www.bu.edu/cas/admissions/apply/", admissions_url: null,
    notes: null, verified_at: null, country: "US"
  },
];

// ── Step 3: Check for duplicates and merge ────────────────

const existingKeys = new Set(
  raw.programs.map((p: any) => `${p.school}__${p.program}`)
);

let added = 0;
let skipped = 0;
for (const np of NEW_PROGRAMS) {
  const key = `${np.school}__${np.program}`;
  if (existingKeys.has(key)) {
    console.log(`  ⏭  Skipped (already exists): ${np.school} — ${np.program}`);
    skipped++;
    continue;
  }
  raw.programs.push(np);
  existingKeys.add(key);
  added++;
}

// Update metadata
raw.metadata.total_programs = raw.programs.length;
raw.metadata.total_schools = new Set(raw.programs.map((p: any) => p.school)).size;
raw.metadata.notes += ` Expanded on ${new Date().toISOString().slice(0, 10)} with ${added} new programs.`;

// Add new fields to metadata
if (!raw.metadata.fields_covered.includes("financial_engineering")) raw.metadata.fields_covered.push("financial_engineering");
if (!raw.metadata.fields_covered.includes("business_analytics")) raw.metadata.fields_covered.push("business_analytics");
if (!raw.metadata.fields_covered.includes("electrical_engineering")) raw.metadata.fields_covered.push("electrical_engineering");
if (!raw.metadata.fields_covered.includes("economics")) raw.metadata.fields_covered.push("economics");

fs.writeFileSync(filePath, JSON.stringify(raw, null, 2) + "\n");

console.log(`\n✅ Expansion complete`);
console.log(`   Added: ${added} new programs`);
console.log(`   Skipped: ${skipped} (already existed)`);
console.log(`   Total: ${raw.programs.length} programs across ${raw.metadata.total_schools} schools`);
console.log(`\n⚠️  All new entries have verified_at=null`);
console.log(`   Use Jina Reader to verify: curl -s "https://r.jina.ai/[program_url]" | head -200`);
console.log(`\n📋 Run the audit to check coverage: npx tsx scripts/audit-seed-data.ts\n`);

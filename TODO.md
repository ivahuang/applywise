# ApplyWise — TODO

> Owner: Iva | Last updated: 2026-04-03
> Rule: Every new conversation starts by reading this file + CONTEXT.md.

---

## DONE (completed 2026-04-02 ~ 04-03)

### P0: Core App Logic ✅
- [x] **generateTasks(program)** — 13 stages × 4 phases, granular tasks with action URLs + source URLs
- [x] **Shared context** (ApplicationsProvider) — cross-page state for apps, lang, toggleTask
- [x] **Stages page** — expandable stages, per-school task checkboxes, progress counts
- [x] **Calendar page** — month grid, deadline dots (color-coded by tier), click to see tasks, "Upcoming" list
- [x] **Delete school with confirmation modal** — warns if tasks have progress
- [x] **.edu source badge** — every school card links to official program page
- [x] **Overview page** — interactive flow chart mind map, hover shows per-school progress, click to stages
- [x] **Enhanced data schema** — wes_eval_type, recs_academic_min, interview_format, essay prompts with full text
- [x] **Enhanced task generation** — TOEFL code in task title, ETS/WES/SEVIS links, rec type labels, visa sub-steps

### P0: Data Pipeline ✅
- [x] **Jina Reader tested** — works, returns clean markdown from .edu URLs
- [x] **AI extraction pipeline built** — Jina → regex (free) → Claude API (needs billing)
  - `src/lib/extract/` — jina.ts, regex-extract.ts, claude-extract.ts, index.ts
  - `src/app/api/extract/route.ts` — POST endpoint, .edu validation
  - Regex extracts: TOEFL min, GRE required, fee, deadline, WES, recs count, degree, department
  - Claude extracts: everything including essay prompts, interview format, Chinese translations
- [x] **School data enriched** — ~50 schools have TOEFL/GRE institution codes
- [x] **Programs expanded** — ~110 programs (76 original + ~35 new across CS, data science, fineng, stats, policy, HCI, education, business analytics)
- [x] **Data audit script** — `npx tsx scripts/audit-seed-data.ts`

### Architecture Decisions Made ✅
- [x] **SaaS model**: ApplyWise controls the API (not BYOK)
- [x] **Credits system**: free tier + paid upgrades (design later)
- [x] **Cache mechanism**: one AI extraction serves all users who search same program
- [x] **Hybrid data**: seed data + user-triggered AI extraction on demand
- [x] **Anthropic API key obtained** — stored in .env.local (billing not yet enabled)

---

## NOW (this week)

### P0: Activate AI Extraction
- [ ] **Enable Anthropic billing** — console.anthropic.com → Billing → add $5
- [ ] **Test full pipeline** — POST /api/extract with a real .edu URL, verify Claude output
- [ ] **"Add by URL" UI** — in SchoolSearch, add input field for pasting program URLs → calls /api/extract → shows preview → confirm to add
- [ ] **Extraction cache** — store extracted data in seed JSON or Supabase so repeat searches don't re-extract

### P0: Data Persistence (critical gap)
- [ ] **Supabase Auth** — email login (currently no auth, all state is in-memory)
- [ ] **Save apps to database** — UserApplication records in Supabase
- [ ] **Save tasksState to database** — persist checkbox progress across sessions
- [ ] Currently everything resets on page refresh — this is the #1 UX gap

### P1: Search & Data
- [ ] Synonym mapping: "CS" → "Computer Science", "comm" → "Communications"
- [ ] Show schools with no program data (with "data pending" badge)
- [ ] Expand program database to ~200 (add more programs via AI extraction)

---

## NEXT (next 2 weeks)

### P1: UI Polish
- [ ] Mobile responsiveness pass
- [ ] Loading states / skeleton screens for extraction
- [ ] Error handling on all API routes
- [ ] "Report inaccuracy" button on program data

### P1: Overview Page Enhancements
- [ ] Animated transitions on the flow chart
- [ ] Click stage node → scroll to that stage in Stages page
- [ ] Deadline countdown badges on urgent stages

### P2: Business Logic
- [ ] Credits/quota system design
- [ ] Rate limiting on /api/extract
- [ ] Extraction usage tracking per user

---

## LATER (Phase 3-5, requires Track B knowledge docs OR AI-native approach)

### Phase 3: AI Deep Interview
- [ ] Chat interface with structured interview flow
- [ ] AI-generated student profile summary
- Note: Can potentially skip Track B docs by using Claude API directly with good prompts

### Phase 4: School Selection Engine
- [ ] AI-powered school recommendations based on student profile
- [ ] Decision board with weight sliders

### Phase 5: Document Workspace
- [ ] Essay editor with AI review
- [ ] Resume builder
- [ ] Recommendation letter guidance

---

## Track B: Knowledge Extraction

| Doc | Status | Priority | Note |
|-----|--------|----------|------|
| 01-school-selection-framework.md | Not started | P1 | Can be partially replaced by AI |
| 02-background-mining-playbook.md | Not started | P1 | Needed for deep interview |
| 03-essay-methodology.md | Not started | P2 | Needed for essay review |
| 04-recommendation-strategy.md | Not started | P2 | Needed for rec guidance |
| 05-program-evaluations.md | Not started | P2 | Partially replaced by AI extraction |
| 06-resume-rules.md | Not started | P2 | Needed for resume builder |

Note: With AI-native approach, some of these can be reduced in priority. The AI extraction pipeline + Claude API can handle much of what was originally planned as manual knowledge docs.

# ApplyWise — TODO

> Owner: Iva | Last updated: 2026-04-02
> Rule: Every new conversation starts by reading this file.

---

## NOW (this week)

### P0: Core App Logic
- [ ] **Port `generateTasks(program)` to Next.js** — when student adds a program, auto-generate checklist (scores/essays/recs/fees/postOffer/visa) based on program data. This is the #1 gap.
  - Input: Program record (greRequired, wesRequired, recsRequired, essays[], fee, interviewReq)
  - Output: Structured tasks object stored in UserApplication.tasksState
  - Affects: Stages view, Calendar view, School detail page
  - Reference: prototype `makeApp()` function in `applewise-v2.jsx` (project files)

- [ ] **Stages page with real data** — port prototype's StagesView to Next.js. 13 stages across 4 phases, each with info guide + official reference links + per-school task checkboxes.

- [ ] **Calendar page with real data** — month grid with deadline dots from added programs.

- [ ] **Delete school with confirmation modal** — "keep materials" vs "remove everything"

### P0: Data Pipeline (Phase 1.5)
- [ ] **Test Jina Reader** — fetch one .edu URL, verify output quality
  - Try: `curl https://r.jina.ai/https://sps.columbia.edu/academics/masters/strategic-communication`
- [ ] **Claude API extraction** — take Jina markdown output, extract structured program data matching Prisma schema
- [ ] **Add to Prisma schema**: `rawContent`, `lastScrapedAt`, `isAutoVerified`, `sourceHash` fields on Program model
- [ ] **"Source: [.edu link]" badge** on all program data in frontend

### P1: Search Improvements
- [ ] Synonym mapping: "CS" → "Computer Science", "comm" → "Communications"
- [ ] Show schools with no Layer 2 data (with "data pending" badge)

---

## NEXT (next 2 weeks)

### P1: Data Pipeline Full
- [ ] Cron job: daily scrape of 50 stalest program URLs
- [ ] Priority queue: most-bookmarked programs scraped first
- [ ] "Report inaccuracy" button → triggers re-scrape
- [ ] Content hash comparison to skip unchanged pages

### P1: UI Polish
- [ ] Mobile responsiveness pass
- [ ] Loading states / skeleton screens
- [ ] Error handling on API routes

### P2: Auth
- [ ] Supabase Auth integration (email login)
- [ ] User profile page
- [ ] Data persistence (currently all client-side state)

---

## LATER (Phase 3-5, requires Track B knowledge docs)

### Phase 3: AI Deep Interview
- Requires: `02-background-mining-playbook.md` filled
- [ ] Chat interface with structured interview flow
- [ ] AI-generated student profile summary

### Phase 4: School Selection Engine
- Requires: `01-school-selection-framework.md` + `05-program-evaluations.md` filled
- [ ] AI-powered school recommendations
- [ ] Decision board with weight sliders

### Phase 5: Document Workspace
- Requires: `03-essay-methodology.md` + `06-resume-rules.md` filled
- [ ] Essay editor with AI review
- [ ] Resume builder
- [ ] Recommendation letter guidance

---

## Track B: Knowledge Extraction (Iva's parallel work)

| Doc | Status | Priority |
|-----|--------|----------|
| 01-school-selection-framework.md | Not started | P0 |
| 02-background-mining-playbook.md | Not started | P0 |
| 03-essay-methodology.md | Not started | P1 |
| 04-recommendation-strategy.md | Not started | P1 |
| 05-program-evaluations.md | Not started | P1 |
| 06-resume-rules.md | Not started | P2 |

Start in a separate chat: "Read 01-school-selection-framework.md from my project files and interview me to fill it out."

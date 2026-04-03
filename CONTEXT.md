# ApplyWise — Context for New Conversations

> Paste this instruction at the start of every new conversation:
> "Read TODO.md, CONTEXT.md, and PROJECT_PLAN.md from my project files. We are working on [TASK]."

---

## What is ApplyWise?

A student-facing web app replacing traditional study-abroad agencies for Chinese students applying to US Master's programs. Combines project management + verified school info + AI advisory.

## Current state (2026-04-02)

### Live on Vercel
- GitHub: github.com/ivahuang/applywise
- Vercel: auto-deploys on push
- Stack: Next.js 16 + TypeScript + Tailwind 4 + Prisma + Supabase

### What works
- Dashboard layout with Sage & Stone theme (warm green palette)
- Sidebar nav: Dashboard / Schools / Stages / Calendar
- EN/ZH language toggle
- School search API (`/api/schools`) — fuzzy match across 102 schools + 76 programs
- SchoolSearch component — two-layer display (school header → program checkboxes)
- Schools page — add programs, tier grouping (reach/target/safe), click tier to cycle, remove

### What doesn't work yet
- Adding a program does NOT auto-generate tasks/stages (key gap)
- Stages page is a skeleton placeholder
- Calendar page is a skeleton placeholder  
- No database connection (reads from JSON files, client-side state only)
- No auth

### Data assets in the repo
- `prisma/data/seed-us-universities.json` — 102 US schools with Chinese names, rankings, coordinates
- `prisma/data/seed-programs.json` — 76 programs with deadlines, TOEFL/GRE reqs, essay prompts, portal URLs
- `prisma/schema.prisma` — School, Program, User, UserApplication models

## Design decisions (locked in)

- **Style**: Editorial Warm + Sage & Stone palette (see `src/lib/theme/tokens.ts`)
- **Bilingual**: full EN/ZH, all strings in `src/lib/i18n.ts`
- **Data policy**: only scrape .edu sites, always show source URL
- **Architecture**: SaaS with AI workers, NOT an AI agent
- **Scraping**: Jina Reader (.edu → markdown) + Claude API (markdown → structured JSON)
- **13 stages across 4 phases**: Pre-submit (WES, TOEFL, GRE, essays, recs, fees) → Waiting (interview, offer tracking) → Post-offer (confirm, deposit, I-20) → Visa (F-1, housing, health, pre-departure)

## Key files to read

| File | What it contains |
|------|-----------------|
| `TODO.md` | Prioritized task list |
| `PROJECT_PLAN.md` | Full technical architecture + DB schema + dev phases |
| `PROJECT_STATUS.md` | Progress tracking + architecture decisions |
| `DATABASE.md` | Data layer docs + seed script usage |
| `src/lib/theme/tokens.ts` | All color tokens |
| `src/lib/i18n.ts` | All bilingual strings |
| `prisma/schema.prisma` | Database models |
| `src/app/api/schools/route.ts` | Search API logic |

## Conversation map

| Conversation | Scope | Status |
|-------------|-------|--------|
| Main (this originated from) | Architecture + design + data + deploy | Done — context too long |
| New: generateTasks | Port auto-task generation to Next.js | TODO |
| New: Stages + Calendar | Build stages and calendar pages | TODO |
| New: Data pipeline | Jina Reader + Claude extraction | TODO |
| New: Knowledge extraction | Fill 01-06 methodology docs (Iva input) | TODO |

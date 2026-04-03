# ApplyWise — Context for New Conversations

> Paste at the start of every new conversation:
> "Read TODO.md, CONTEXT.md, and PROJECT_PLAN.md from my project files. We are working on [TASK]."

---

## What is ApplyWise?

A student-facing web app replacing traditional study-abroad agencies for Chinese students applying to US Master's programs. Combines project management + verified school info + AI-powered extraction + stage-based task tracking.

**Core philosophy: AI-native.** The system should self-evolve. Data comes from AI extraction of .edu pages, not manual maintenance. The human confirms, not creates.

## Current state (2026-04-03)

### Live on Vercel
- GitHub: github.com/ivahuang/applywise
- Vercel: auto-deploys on push
- Stack: Next.js 16 + TypeScript + Tailwind 4 + Prisma + Supabase

### What works
- Dashboard with 4 pages: Overview, Schools, Stages, Calendar
- **Overview**: interactive flow chart (4 phases × 13 stages), hover shows per-school progress with task checkboxes
- **Schools**: search + add programs, tier grouping (reach/target/safe), .edu source badge, delete with confirmation
- **Stages**: 13 expandable stages, per-school task lists with checkboxes, progress counts
- **Calendar**: month grid with deadline dots, click date to see/check tasks, "Upcoming" list
- Sidebar nav + EN/ZH language toggle
- Shared context (ApplicationsProvider) — state persists across pages within session
- **generateTasks()**: creates granular checklist from program data, every task has action URL + source URL
- **AI extraction pipeline** (code built, needs billing to activate Claude layer):
  - `POST /api/extract` — accepts .edu URL
  - Jina Reader (free) → regex extraction (free) → Claude API (needs $5 billing)
  - Regex gets ~60-70% of fields; Claude gets 100% including essay prompts

### What doesn't work yet
- **No data persistence** — everything resets on page refresh (no auth, no database connection)
- **No "Add by URL" UI** — extraction API exists but no frontend to call it
- **Claude API billing not enabled** — API key exists, needs payment method
- All state is client-side (React context), not saved to Supabase

### Data assets in the repo
- `prisma/data/seed-us-universities.json` — 102 US schools with TOEFL/GRE codes
- `prisma/data/seed-programs.json` — ~110 programs with enriched fields (essays, recs, WES, interview)
- `prisma/schema.prisma` — School, Program, User, UserApplication models
- `scripts/audit-seed-data.ts` — data completeness checker
- `scripts/enrich-school-data.ts` — adds institution codes to schools
- `scripts/expand-programs.ts` — adds new programs

## Architecture

### Tech stack (confirmed)
```
Frontend:     Next.js 16 (App Router) + TypeScript + Tailwind CSS 4
State:        React Context (client-side) → will migrate to Supabase
Database:     PostgreSQL via Supabase + Prisma ORM
Auth:         Supabase Auth (not yet integrated)
AI:           Claude API via Anthropic (key obtained, billing pending)
Extraction:   Jina Reader (free) + Claude API (paid)
Hosting:      Vercel (auto-deploy from GitHub)
```

### Key file map

| File | What it contains |
|------|-----------------|
| `TODO.md` | Prioritized task list (start here) |
| `CONTEXT.md` | This file — project briefing |
| `PROJECT_PLAN.md` | Full tech architecture + DB schema + dev phases |
| `src/lib/tasks/` | Task generation: types, stages, generateTasks() |
| `src/lib/extract/` | AI extraction pipeline: jina, regex, claude, orchestrator |
| `src/lib/context/applications.tsx` | Shared state: apps, lang, addProgram, toggleTask |
| `src/lib/theme/tokens.ts` | Color tokens (Sage & Stone palette) |
| `src/lib/i18n.ts` | Bilingual strings (140+) |
| `src/app/api/schools/route.ts` | School search API (fuzzy match) |
| `src/app/api/extract/route.ts` | AI extraction API (URL → structured data) |
| `src/app/(dashboard)/overview/page.tsx` | Flow chart mind map |
| `src/app/(dashboard)/schools/page.tsx` | School list + search + delete |
| `src/app/(dashboard)/stages/page.tsx` | Stage-based task management |
| `src/app/(dashboard)/calendar/page.tsx` | Calendar view |
| `prisma/data/seed-programs.json` | Program database (~110 entries) |
| `prisma/data/seed-us-universities.json` | School database (102 entries) |

### Business model decisions
- **SaaS model**: ApplyWise controls the AI API (not user-brings-own-key)
- **Credits system**: free tier (limited extractions) + paid tier (unlimited)
- **Cache**: one AI extraction serves all users searching the same program
- **Data trust**: only .edu sources, always show source link, user can verify

### Data flow
```
User adds program by URL
  → POST /api/extract { url: "https://school.edu/program" }
  → Jina Reader fetches page as markdown (free)
  → Regex extracts basic fields (free)
  → Claude API extracts full structured data ($0.01/extraction)
  → Result cached in database
  → Future users searching same program get cached result instantly
  → generateTasks(program) creates actionable checklist
  → Tasks appear in Stages, Calendar, Overview with links
```

## Design decisions (locked in)
- **Style**: Editorial Warm + Sage & Stone palette
- **Bilingual**: full EN/ZH, all strings in i18n.ts
- **Data policy**: only scrape .edu sites, always show source URL
- **13 stages × 4 phases**: Pre-submit → Waiting → Post-offer → Visa
- **Every task has 2 URLs**: action link (do the thing) + source link (where requirement came from)
- **Transparent AI**: all AI-extracted data marked as such, user can verify

## What NOT to do
- Do NOT manually maintain program data — use AI extraction
- Do NOT require users to configure their own API keys
- Do NOT build features that require Track B knowledge docs first — use AI as fallback
- Do NOT use localStorage in artifacts (not supported)

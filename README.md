# ApplyWise

Graduate application management platform for Chinese students applying to US Master's programs.

## Tech Stack

- **Framework**: Next.js 16 (App Router) + TypeScript
- **Styling**: Tailwind CSS 4 + custom Sage & Stone theme
- **Database**: PostgreSQL via Supabase + Prisma ORM
- **Icons**: Lucide React

## Quick Start

### 1. Install

```bash
cd applewise
npm install
npm install -D tsx  # needed for seed script
```

### 2. Set up Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

### 3. Initialize database

```bash
npm run db:push      # push schema to database
npm run db:seed      # populate 102 schools + 76 programs
```

### 4. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Project Structure

```
prisma/
├── schema.prisma              # Database schema
├── seed.ts                    # Seed script
└── data/
    ├── seed-us-universities.json  # 102 schools (Layer 1)
    └── seed-programs.json         # 76 programs (Layer 2)
src/
├── app/
│   ├── (dashboard)/           # Dashboard pages with sidebar
│   │   ├── overview/          # Main dashboard
│   │   ├── schools/           # School list + search + add
│   │   ├── stages/            # Stage-based management
│   │   └── calendar/          # Deadline calendar
│   └── api/schools/           # Search API
├── components/dashboard/
│   └── SchoolSearch.tsx       # Fuzzy search component
└── lib/
    ├── i18n.ts                # EN/ZH bilingual strings
    └── theme/tokens.ts        # Sage & Stone design tokens
```

## Database Layers

| Layer | Content | Count | Update |
|-------|---------|-------|--------|
| 1 | US universities | 102 | Annually (May) |
| 2 | Graduate programs | 76 across 28 schools | Annually (Aug) + deadline check (Oct) |
| 3 | AI-fetched on demand | Dynamic | Per student request |

## Available Scripts

```bash
npm run dev          # Start dev server
npm run db:push      # Push schema to DB
npm run db:seed      # Seed schools + programs
npm run db:studio    # Open Prisma Studio (DB GUI)
npm run db:migrate   # Run migrations
```

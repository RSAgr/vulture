## Day 0 — 2026-05-06
**Hours worked:** 1
**What I did:** It's a long pdf so to ensure I am not missing out anything (be it the naming or preferences), I discussed the project structure with ChatGPT. Also, it suggested Next. Though I was relentant to use it at first, since I have never really used it. On querying further, I liked it.
**What I learned:** Next.js is not much harder from React. Moreover, for small projects I can easily manage backend from it.
**Blockers / what I'm stuck on:** Too much complex project, the expectations are really high - it doesn't seem like building just a web application rather a complete researched product
**Plan for tomorrow:** Would start with frontend. Frontend designing and other stuffs are boring for me. Would start with backend soon. Have great ideas around use of concepts of ML too, and obviously an LLM for explanation of the results.

## Day 1 — 2026-05-07
**Hours worked:** 2.5
**What I did:** Built the first complete assignment-ready frontend pass for the landing page. Implemented missing page sections (Hero, Features, Process, CTA), wired Navbar/Footer shell, updated typography + metadata, and fixed global styling issues that were conflicting with Tailwind v4 setup.
**What I learned:** A clean visual system with consistent spacing and a focused palette drastically improves perceived product maturity even before backend integrations are ready.
**Blockers / what I'm stuck on:** Detailed assignment rubric file is not yet captured in repo docs, so frontend implementation is based on the current project direction and conversion-focused assumptions.
**Plan for tomorrow:** Connect this UI with real audit and lead capture flows, then validate responsiveness and Lighthouse/performance metrics. But first, let us do the tests file - I have pushed the empty file and now getting failures mails from github

## Day 2 — 2026-05-08
**Hours worked:** 1.5
**What I did:** Set up comprehensive testing infrastructure from scratch. Added Vitest as the test framework with React Testing Library for component testing. Created initial test suite covering utility functions (cn helper), core components (Navbar, Container), and a proper CI/CD workflow. Populated the previously empty TESTS.md with testing strategy, structure, and guidelines.
**What I learned:** Setting up testing early prevents GitHub CI failures and establishes a solid foundation for test-driven development. Using Vitest over Jest provides faster tests with better TypeScript integration for a Next.js project.
**Blockers / what I'm stuck on:** None - test infrastructure is now in place to prevent failed CI checks.
**Plan for tomorrow:** Backend

## Day 3 — 2026-05-09
**Hours worked:** 2.5
**What I did:** Implemented per-tool audit inputs instead of a single aggregate input. Updated `src/services/audit.service.ts` to accept a `tools` array (each with name, plan, monthlySpend, seats) while maintaining backward compatibility with the legacy comma-separated format. Rewrote `calculateAudit()` to aggregate per-tool spend and compute seat waste per tool, enabling detection of overlapping tool redundancy and seat under-utilization. Rewrote the entire `CreditAuditForm` component with dynamic tool rows (add/remove rows), proper grid layout with column spans to prevent input overlap, and wired form to POST to `/api/result` for server-side computation. Shareable links provide a lightweight sharing mechanism without requiring login—perfect for collaborative audit reviews and demo/prospect sharing workflows.
**What I learned:** Per-tool inputs unlock deeper audit insights: overlapping tool detection (e.g., multiple subscriptions to similar models), per-tool seat waste calculation, and more accurate plan-based adjustments.
**Plan for tomorrow:** Add persistent storage (database models + writes) for audits/leads, then begin building the detailed audit report page to display full breakdown and recommendations. Have email connected to send real emails for acknowledgements.

## Day 4 — 2026-05-10
**Hours worked:** 3
**What I did:**
- Implemented a deterministic, recommendation-based audit engine in `src/lib/audit-engine/` (pricing catalog, overlap detector, recommendation rules, scoring, evaluator) and rewired `src/services/audit.service.ts` to use `evaluateAudit()` while preserving legacy response fields for backward compatibility.
- Added a safe LLM summarization layer at `src/lib/ai/ai-summary.ts` which builds a strict prompt, attempts a Gemini SDK call if `GEMINI_API_KEY` is present, validates numeric output against provided values, and falls back to a deterministic templated summary on timeout/error/hallucination.
- Wired the frontend to surface the summary: added `src/app/api/summary/route.ts` and updated `src/components/form/CreditAuditForm.tsx` to POST the audit result to `/api/summary`, showing a concise executive summary in the UI.
- Implemented shareable links (`src/services/share.service.ts`, `/api/share`) and a public read-only audit page at `/audit/[shareId]`.
- Fixed test & lint regressions, upgraded `@testing-library/react` for React 19 compatibility, and confirmed all tests and lint pass locally.

**What I learned:**
- Keep LLM integrations strictly read-only for numeric/financial summaries — validate all numbers server-side and provide deterministic fallbacks to avoid hallucinations.
- Prefer best-effort SDK calls with clear timeouts and non-blocking fallbacks so the UI remains responsive even if external APIs are slow or misconfigured.

**Blockers / what I'm stuck on:**
- Persistence: current share/lead storage uses in-memory Maps — migrate to a DB for production durability.
- Email sending: `lead.service.ts` still needs a real SMTP/transactional provider integration.

**Plan for next steps:**
- Migrate in-memory storage to a persistent DB (recommended priority).
- Integrate a transactional email provider and update `lead.service.ts` to send the detailed report.
- Add unit tests for the new `src/lib/audit-engine/*` modules and for `src/lib/ai/ai-summary.ts` validation/fallback behavior.

**ENV / local setup for LLM:**
- Create a `.env.local` file in the project root and add:

```
GEMINI_API_KEY=your_gemini_api_key_here
```

- If you need the SDK installed manually later, the package is `@google/generative-ai`.

If the key is absent, the service automatically returns the deterministic fallback summary.

## Day 5 — 2026-05-11
**Hours worked:** 1.5
**What I did:**
- Set up Prisma ORM with SQLite as the default schema, creating models for `Share` and `Lead` with proper timestamps, expiry tracking, and JSON storage for nested data.
- Created `src/lib/prisma.ts` singleton client wrapper for safe Next.js server-side usage.
- Migrated `src/services/share.service.ts` from in-memory `Map` storage to Prisma persistent queries: `createShare()` now writes to DB, `getShare()` fetches and validates expiry, expired shares are deleted on retrieval.
- Migrated `src/services/lead.service.ts` to persist leads to Prisma DB with context and optional audit snapshots.
- Updated all API routes (`/api/share`, `/api/lead`) to `await` the now-async service functions.
- Added `.env.local` with `DATABASE_URL="file:./dev.db"` for local SQLite development.
- Installed Prisma packages (`prisma@6.4.1`, `@prisma/client@6.4.1`), ran `npx prisma generate` to create the client, and `npx prisma db push` to push schema and create `dev.db`.
- Fixed `vitest.config.ts` by removing the conflicting `@vitejs/plugin-react` to resolve TypeScript plugin version mismatch that was blocking the build.
- Verified full build passes with Next.js compilation, TypeScript type checking, and static page generation all successful.

**What I learned:**
- Prisma's singleton pattern prevents connection pool exhaustion in Next.js server functions across multiple request contexts.
- Removing test-only plugins from the build config (vitest react plugin) prevents unexpected TypeScript conflicts with production vite dependencies.

**Blockers / what I'm stuck on:** None — DB persistence is fully implemented and working.

**Ready to deploy:**
- All code built and tested locally; ready for production deployment.
- Two environment variables needed on host: `GEMINI_API_KEY` (Google API) and `DATABASE_URL` (production database connection string).
- For production DB, recommend Supabase (PostgreSQL), Railway, or PlanetScale instead of SQLite file.

**Plan for next steps:**
- Deploy to Vercel or preferred host; set env vars in deployment dashboard.
- Integrate transactional email provider (SendGrid/SES/Postmark) to send lead capture confirmation.
- Add unit tests for audit-engine modules and ai-summary validation/fallback behavior.

## Day 6 — 2026-05-12
**Hours worked:** 1
**What I did:**
- Discussed and demoed the product with the CTO of VinayakAI; walked through the audit flow, LLM summary behavior, and shareable links.
- Collected feedback on deployment choices and email integration; validated the Prisma persistence strategy with a preference for managed Postgres in production.
**What I learned:**
- CTO suggested prioritizing transactional email confirmations and reliable DB backups; recommended using a managed Postgres provider for production.
**Blockers / what I'm stuck on:** None — alignment achieved with CTO feedback.
**Plan for tomorrow:**
- Integrate the chosen email provider and finalize production `DATABASE_URL`; prepare final deployment verification and monitoring.


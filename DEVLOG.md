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

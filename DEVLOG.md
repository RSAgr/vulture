## Day 0 — 2026-05-06
**Hours worked:** 1
**What I did:** It's a long pdf so to ensure I am not missing out anything (be it the naming or preferences), I discussed the project structure with ChatGPT. Also, it suggested Next. Though I was relentant to use it at first, since I have never really used it. On querying further, I liked it.
**What I learned:** Next.js is not much harder from React. Moreover, for small projects I can easily manage backend from it.
**Blockers / what I'm stuck on:** Too much complex project, the expectations are really high - it doesn't seem like building just a web application rather a complete researched product
**Plan for tomorrow:** Would start with frontend. Frontend designing and other stuffs are boring for me. Would start with backend soon. Have great ideas around use of concepts of ML too, and obviously an LLM for explanation of the results.

## Day 1 — 2026-05-07
**Hours worked:** 2.5
**What I did:** 
Built the first complete assignment-ready frontend pass for the landing page. Implemented missing page sections (Hero, Features, Process, CTA), wired Navbar/Footer shell, updated typography + metadata, and fixed global styling issues that were conflicting with Tailwind v4 setup. 

Added a dedicated page/form where companies can submit details and immediately see if they are overspending on credits. Implemented `/check-credits` route, built a client-side overspending estimator, connected CTA + navbar links to this flow, and updated `/api/lead` to accept submissions.

Updated form inputs to exactly collect AI tools paid for, current plan, monthly spend, team size, and primary use case. Refactored flow so value is shown first and email capture happens only after the estimate is displayed.

**What I learned:** A clean visual system with consistent spacing and a focused palette drastically improves perceived product maturity even before backend integrations are ready.
**Blockers / what I'm stuck on:** Detailed assignment rubric file is not yet captured in repo docs, so frontend implementation is based on the current project direction and conversion-focused assumptions.
**Plan for tomorrow:** Connect this UI with real audit and lead capture flows, then validate responsiveness and Lighthouse/performance metrics.

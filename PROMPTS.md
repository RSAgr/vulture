AI Summary PROMPTS and Design

Purpose
- The AI layer is used only to generate a human-friendly, personalized audit summary. All numeric calculations, pricing lookups, and recommendation logic are deterministic and rule-based.
- This separation prevents hallucination in financial outputs and enables audit defensibility.

Prompt Design Decisions
- Input is structured JSON (not raw user text). The model receives only: `teamSize`, `primaryUseCase`, `actionableMonthlySavings`, and `recommendations` (title, explanation, monthlySavings, confidence).
- The prompt contains an explicit RULES section instructing the model NOT to perform calculations or invent numbers.
- Output is constrained: a single 80-120 word paragraph in a startup/SaaS tone.

Why deterministic logic for calculations
- Pricing and savings must be traceable to catalog data or explicit rule outcomes (plan deltas, redundant tooling consolidation).
- Deterministic rules make recommendations auditable and defensible in conversations with finance or procurement teams.

Hallucination prevention strategy
- The model is provided only the fields it may reference; no external context or pricing tables are exposed to it.
- The integration validates the LLM result: any numeric string in the output is compared against known allowed values (actionableMonthlySavings and recommendation monthlySavings). If the model includes unauthorized numbers, we discard the LLM output and use a deterministic fallback template.
- LLM calls are timeboxed; timeouts cause deterministic fallback.

Anthropic SDK usage
- The code includes a lightweight Anthropic integration structure that attempts to load the SDK and call the model if an API key is configured.
- The system degrades gracefully to a deterministic fallback if the SDK is not available, the API key is missing, a timeout occurs, or the model output fails validation.

Security and Privacy
- The prompt and input should avoid any PII unless explicitly permitted by the user. If PII is necessary, redact or hash it before sending to the LLM.

Developer notes
- The LLM must not be used to compute or generate pricing or to invent recommendations. Any new rule must be implemented in the deterministic recommendation engine and then surfaced to the LLM for summarization only.

Example prompt template (for reference)
```
You are an assistant that writes concise (80-120 word) executive summaries for AI spend audits.

RULES:
- Do NOT calculate savings or invent pricing.
- Reference only the numeric values provided in the INPUT block.
- Do NOT add recommendations or change existing recommendation phrasing.

INPUT:
{ "teamSize": 12, "primaryUseCase": "coding", "actionableMonthlySavings": 1200.00, "recommendations": [{"title":"Consolidate coding assistants","monthlySavings":600.00, "confidence":"medium"} ] }

OUTPUT: Provide an 80-120 word professional, SaaS-style summary addressing the client.
```

This file documents the prompt choices and the safety/fallback strategy used by the AI summary component in `src/lib/ai/ai-summary.ts`.

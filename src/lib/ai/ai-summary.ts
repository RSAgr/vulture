/*
  AI Summary module
  - Builds a safe prompt from structured audit output
  - Calls Gemini SDK (integration skeleton)
  - Falls back to deterministic templated summary on error / timeout / invalid response

  Rules enforced in prompt builder:
  - The model MUST NOT calculate savings or invent numbers
  - The model MUST ONLY summarize and personalize using provided fields
  - The model MUST reference only values supplied in the structured input
*/

export type SummaryInput = {
  teamSize?: number | null;
  primaryUseCase?: string | null;
  actionableMonthlySavings: number;
  recommendations: Array<{
    title: string;
    explanation: string;
    monthlySavings: number;
    annualSavings: number;
    confidence: "low" | "medium" | "high";
    severity: "low" | "medium" | "high";
    type: string;
  }>;
  // optional short metadata
  companyName?: string;
};

// Timeout for LLM call in ms
const LLM_TIMEOUT = 5000;

function buildPrompt(input: SummaryInput) {
  // Provide the model with strict rules and the structured data only.
  // The model is explicitly forbidden from performing arithmetic or inventing numbers.
  const header = `You are an assistant that writes concise, professional SaaS-style executive summaries for AI spend audits.\n`;

  const rules = `RULES:\n- Do NOT calculate savings, invent pricing, or perform any audit logic.\n- Reference only the numeric values provided in the input.\n- Do NOT invent or change recommendation content.\n- Produce a single 80-120 word paragraph in a startup/SaaS tone that is concise and actionable.\n- If actionableMonthlySavings is zero and there are no recommendations, explain clearly that no deterministic savings were identified and suggest verification or monitoring steps.\n`;

  const data = {
    teamSize: input.teamSize ?? null,
    primaryUseCase: input.primaryUseCase ?? null,
    actionableMonthlySavings: input.actionableMonthlySavings,
    recommendations: input.recommendations.map((r) => ({ title: r.title, monthlySavings: r.monthlySavings, confidence: r.confidence })),
    companyName: input.companyName ?? null,
  };

  const prompt = `${header}\n${rules}\nINPUT:${JSON.stringify(data, null, 2)}\n\nOUTPUT: Provide the 80-120 word summary now.`;
  return prompt;
}

// Lightweight deterministic fallback summary generator. Uses only provided fields.
export function fallbackSummary(input: SummaryInput) {
  const company = input.companyName ? `${input.companyName} — ` : "";
  const team = input.teamSize ? `${input.teamSize} people` : "your team";
  const useCase = input.primaryUseCase ? `${input.primaryUseCase} workflows` : "your primary workflows";

  if ((input.recommendations?.length ?? 0) === 0 && input.actionableMonthlySavings === 0) {
    return `${company}The audit found no deterministic cost-saving actions based on the supplied data. For ${team} focused on ${useCase}, your current plan mix appears optimized or lacks clear consolidation paths. Consider validating billing line items, tracking usage patterns over 30–90 days, and sharing invoices for a deeper review.`;
  }

  const savingsPhrase = input.actionableMonthlySavings > 0 ? `Estimated actionable savings: $${input.actionableMonthlySavings.toFixed(2)} / month.` : "No immediate deterministic savings identified.";

  const recs = (input.recommendations ?? []).slice(0, 3).map((r) => `• ${r.title} (${r.confidence} confidence)`).join(" ");

  return `${company}Snapshot for ${team} (${useCase}): ${savingsPhrase} Top recommendations: ${recs}`;
}

import { GoogleGenerativeAI } from "@google/generative-ai";

// Gemini SDK integration structure (non-blocking). If a Gemini client is configured via
// environment variables, this function will attempt a call; otherwise it will immediately fallback.
// The implementation purposely keeps the LLM call as a best-effort, with strict input and a timeout.

async function callGemini(prompt: string): Promise<string> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("Gemini API key missing");

  const googleAI = new GoogleGenerativeAI(key);
  const model = googleAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  const res = await model.generateContent(prompt);
  // Gemini SDK response object has a text() method
  const text = typeof (res as any).text === "function" ? (res as any).text() : (res.response as any)?.text?.();
  return text ?? "";
}

export async function generateSummary(input: SummaryInput, opts?: { timeoutMs?: number }) {
  const prompt = buildPrompt(input);
  const timeout = opts?.timeoutMs ?? LLM_TIMEOUT;

  // race LLM call vs timeout
  try {
    const llmPromise = callGemini(prompt);
    const result = await Promise.race([
      llmPromise,
      new Promise<string>((_, rej) => setTimeout(() => rej(new Error("LLM timeout")), timeout)),
    ]);

    if (!result || typeof result !== "string" || result.trim().length === 0) {
      return { text: fallbackSummary(input), usedFallback: true };
    }

    // Basic safety: ensure no digit-only hallucinated savings beyond provided field.
    // We will strip numbers not in the provided actionableMonthlySavings or recommendation monthlySavings.
    // For simplicity, if we detect numbers not matching provided values, fallback.

    const allowedNumbers = new Set<string>();
    allowedNumbers.add(input.actionableMonthlySavings.toFixed(2));
    for (const r of input.recommendations ?? []) {
      allowedNumbers.add(r.monthlySavings.toFixed(2));
    }

    const detectedNumbers = Array.from(result.matchAll(/\$?\d{1,3}(?:,\d{3})*(?:\.\d+)?/g)).map((m) => m[0].replace(/\$/g, "").replace(/,/g, ""));

    const forbidden = detectedNumbers.some((num) => {
      // normalize to two decimals
      const n = Number(num);
      if (!Number.isFinite(n)) return true;
      const s = n.toFixed(2);
      return !allowedNumbers.has(s);
    });

    if (forbidden) {
      return { text: fallbackSummary(input), usedFallback: true };
    }

    return { text: result.trim(), usedFallback: false };
  } catch (err) {
    return { text: fallbackSummary(input), usedFallback: true, error: String(err) };
  }
}

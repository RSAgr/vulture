import { NextResponse } from "next/server";
import { generateSummary } from "@/lib/ai/ai-summary";

type SummaryRecommendationInput = {
  title: string;
  explanation: string;
  monthlySavings: number;
  annualSavings: number;
  confidence: "low" | "medium" | "high";
  severity: "low" | "medium" | "high";
  type: string;
};

type SummaryRequestInput = {
  teamSize?: number;
  primaryUseCase?: string;
  actionableMonthlySavings: number;
  recommendations: SummaryRecommendationInput[];
  companyName?: string;
};

function isSummaryRecommendationInput(value: unknown): value is SummaryRecommendationInput {
  if (!value || typeof value !== "object") return false;

  const record = value as Record<string, unknown>;
  return typeof record.title === "string"
    && typeof record.explanation === "string"
    && typeof record.monthlySavings === "number"
    && typeof record.annualSavings === "number"
    && (record.confidence === "low" || record.confidence === "medium" || record.confidence === "high")
    && (record.severity === "low" || record.severity === "medium" || record.severity === "high")
    && typeof record.type === "string";
}

export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
  }

  const data = payload as Record<string, unknown>;

  if (typeof data.actionableMonthlySavings !== "number" || !Array.isArray(data.recommendations)) {
    return NextResponse.json({ error: "Invalid summary input." }, { status: 400 });
  }

  try {
    const recommendations = data.recommendations.filter(isSummaryRecommendationInput);

    if (recommendations.length !== data.recommendations.length) {
      return NextResponse.json({ error: "Invalid recommendation payload." }, { status: 400 });
    }

    const input = {
      teamSize: typeof data.teamSize === "number" ? data.teamSize : data.teamSize ? Number(data.teamSize) : undefined,
      primaryUseCase: typeof data.primaryUseCase === "string" ? String(data.primaryUseCase) : undefined,
      actionableMonthlySavings: Number(data.actionableMonthlySavings),
      recommendations,
      companyName: typeof data.companyName === "string" ? String(data.companyName) : undefined,
    } satisfies SummaryRequestInput;

    const res = await generateSummary(input, { timeoutMs: 6000 });
    return NextResponse.json({ ok: true, text: res.text, usedFallback: res.usedFallback ?? false, error: res.error ?? null }, { status: 200 });
  } catch (err: unknown) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}

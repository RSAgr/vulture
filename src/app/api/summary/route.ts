import { NextResponse } from "next/server";
import { generateSummary } from "@/lib/ai/ai-summary";

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
    const input = {
      teamSize: typeof data.teamSize === "number" ? data.teamSize : data.teamSize ? Number(data.teamSize) : undefined,
      primaryUseCase: typeof data.primaryUseCase === "string" ? String(data.primaryUseCase) : undefined,
      actionableMonthlySavings: Number(data.actionableMonthlySavings),
      recommendations: (data.recommendations as any[]).map((r) => ({
        title: String(r.title ?? ""),
        explanation: String(r.explanation ?? ""),
        monthlySavings: Number(r.monthlySavings ?? 0),
        annualSavings: Number(r.annualSavings ?? 0),
        confidence: (r.confidence as any) ?? "low",
        severity: (r.severity as any) ?? "low",
        type: (r.type as any) ?? "unknown",
      })),
      companyName: typeof data.companyName === "string" ? String(data.companyName) : undefined,
    };

    const res = await generateSummary(input as any, { timeoutMs: 6000 });
    return NextResponse.json({ ok: true, text: res.text, usedFallback: res.usedFallback ?? false, error: res.error ?? null }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}

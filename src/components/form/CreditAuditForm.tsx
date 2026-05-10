"use client";

import { FormEvent, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { TOOL_OPTIONS, TOOL_PLANS, type ToolName } from "@/lib/tools-config";

type ToolRow = {
  name: ToolName;
  plan: string;
  monthlySpend: string;
  seats: string;
};

type ServerAuditResult = {
  toolCount: number;
  totalMonthlySpend: number;
  actionableMonthlySavings: number;
  actionableAnnualSavings: number;
  recommendations: Array<{
    title: string;
    explanation: string;
    monthlySavings: number;
    annualSavings: number;
    confidence: "low" | "medium" | "high";
    severity: "low" | "medium" | "high";
    type: "plan-downgrade" | "duplicate-tooling" | "redundancy";
  }>;
  overlapAnalysis: {
    riskLevel: "low" | "medium" | "high";
    riskScore: number;
    capabilityClusters: Array<{ capability: string; tools: string[]; monthlyExposure: number }>;
    detectedPatterns: string[];
  };
  scoring: {
    efficiencyScore: number;
    overlapRisk: number;
    optimizationIndicators: string[];
    heuristicOverlapRate: number;
  };
  overlapWaste: number;
  seatWaste: number;
  potentialSavingsLow: number;
  potentialSavingsHigh: number;
  efficiencyScore: number;
};

const emptyTool = (): ToolRow => ({ name: "ChatGPT", plan: "Plus", monthlySpend: "", seats: "" });

export default function CreditAuditForm() {
  const [tools, setTools] = useState<ToolRow[]>([emptyTool()]);
  const [teamSize, setTeamSize] = useState("");
  const [primaryUseCase, setPrimaryUseCase] = useState("");

  const [email, setEmail] = useState("");
  const [result, setResult] = useState<ServerAuditResult | null>(null);
  const [shareUrl, setShareUrl] = useState("");
  const [summary, setSummary] = useState<{ text: string; usedFallback?: boolean } | null>(null);
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);
  const [isCapturingLead, setIsCapturingLead] = useState(false);
  const [submitMessage, setSubmitMessage] = useState("");
  const [isLoadingEstimate, setIsLoadingEstimate] = useState(false);

  function updateTool(index: number, patch: Partial<ToolRow>) {
    setTools((prev) => prev.map((t, i) => (i === index ? { ...t, ...patch } : t)));
  }

  function addTool() {
    setTools((prev) => [...prev, emptyTool()]);
  }

  function removeTool(index: number) {
    setTools((prev) => prev.filter((_, i) => i !== index));
  }

  function toNumber(value: string): number {
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
  }

  const isFormValid = useMemo(() => {
    if (!primaryUseCase.trim()) return false;
    if (tools.length === 0) return false;
    for (const t of tools) {
      if (!t.name.trim()) return false;
      if (toNumber(t.monthlySpend) <= 0) return false;
    }
    return true;
  }, [tools, primaryUseCase]);

  async function handleEstimateSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitMessage("");

    if (!isFormValid) {
      setSubmitMessage("Please fill all fields to generate your estimate.");
      return;
    }

    setIsLoadingEstimate(true);

    try {
      const payload = {
        tools: tools.map((t) => ({ name: t.name, plan: t.plan || undefined, monthlySpend: t.monthlySpend, seats: t.seats || undefined })),
        primaryUseCase,
        teamSize: teamSize || undefined,
      };

      const res = await fetch("/api/result", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const body = await res.json();
      if (!res.ok) {
        setSubmitMessage(body?.error ?? "Failed to generate estimate.");
        return;
      }

      // backend returns summary/result structure
      setResult(body.result ?? null);

      // Fire-and-forget: request a human-friendly LLM summary from the server
      (async () => {
        try {
          setIsLoadingSummary(true);
          setSummary(null);
          const sres = await fetch("/api/summary", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              actionableMonthlySavings: body.result?.actionableMonthlySavings ?? 0,
              recommendations: body.result?.recommendations ?? [],
              teamSize: teamSize ? Number(teamSize) : undefined,
              primaryUseCase,
            }),
          });

          const sb = await sres.json();
          if (sres.ok && sb?.text) {
            setSummary({ text: sb.text, usedFallback: sb.usedFallback });
          }
        } catch (err) {
          // keep UI silent — fallback summary exists elsewhere
        } finally {
          setIsLoadingSummary(false);
        }
      })();
    } catch {
      setSubmitMessage("Failed to fetch estimate. Try again.");
    } finally {
      setIsLoadingEstimate(false);
    }
  }

  async function handleEmailCapture(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitMessage("");

    if (!result) {
      setSubmitMessage("Generate value first, then submit your email.");
      return;
    }

    if (!/.+@.+\..+/.test(email)) {
      setSubmitMessage("Please provide a valid work email.");
      return;
    }

    setIsCapturingLead(true);
    try {
      const payload = {
        email,
        tools: tools.map((t) => ({ name: t.name, plan: t.plan || undefined, monthlySpend: t.monthlySpend, seats: t.seats || undefined })),
        primaryUseCase,
        teamSize: teamSize || undefined,
        auditSnapshot: result,
      };

      const res = await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const body = await res.json();
      if (!res.ok) {
        setSubmitMessage(body?.error ?? "Failed to capture email.");
        return;
      }

      setSubmitMessage("Estimate sent. We will share your detailed breakdown by email.");
    } catch {
      setSubmitMessage("Value generated, but email capture failed. Please retry.");
    } finally {
      setIsCapturingLead(false);
    }
  }

  async function handleGenerateShare() {
    if (!result) {
      setSubmitMessage("Generate estimate first.");
      return;
    }

    try {
      const payload = {
        tools: tools.map((t) => ({ name: t.name, plan: t.plan || undefined, monthlySpend: toNumber(t.monthlySpend), seats: t.seats ? toNumber(t.seats) : undefined })),
        primaryUseCase,
        teamSize: teamSize ? toNumber(teamSize) : undefined,
        auditResult: result,
      };

      const res = await fetch("/api/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const body = await res.json();
      if (!res.ok) {
        setSubmitMessage(body?.error ?? "Failed to generate share link.");
        return;
      }

      setShareUrl(body.shareUrl);
      setSubmitMessage("Share link generated! Copy it below.");
    } catch {
      setSubmitMessage("Failed to generate share link.");
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
      <form onSubmit={handleEstimateSubmit} className="rounded-3xl border border-zinc-900/10 bg-white p-6 shadow-[0_16px_60px_-34px_rgba(0,0,0,0.5)] sm:p-8">
        <h2 className="text-2xl font-black text-zinc-950">Company AI Spend Audit</h2>
        <p className="mt-2 text-sm text-zinc-600">Step 1: Enter per-tool usage data. We show value first, then ask for email.</p>

        <div className="mt-6 space-y-4">
          {tools.map((tool, idx) => {
            const availablePlans = TOOL_PLANS[tool.name] || [];
            return (
              <div key={idx} className="grid gap-3 sm:grid-cols-4 sm:items-end min-w-0">
                <label className="grid gap-1.5 text-sm font-medium text-zinc-800 sm:col-span-2 min-w-0">
                  Tool
                  <select
                    value={tool.name}
                    onChange={(e) => {
                      const newName = e.target.value as ToolName;
                      const newPlans = TOOL_PLANS[newName] || [];
                      updateTool(idx, { name: newName, plan: newPlans[0] || "" });
                    }}
                    className="h-11 rounded-xl border border-zinc-300 px-3 outline-none bg-white w-full min-w-0"
                    required
                  >
                    {TOOL_OPTIONS.map((toolOpt) => (
                      <option key={toolOpt} value={toolOpt}>
                        {toolOpt}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="grid gap-1.5 text-sm font-medium text-zinc-800 sm:col-span-1 min-w-0">
                  Plan
                  <select
                    value={tool.plan}
                    onChange={(e) => updateTool(idx, { plan: e.target.value })}
                    className="h-11 rounded-xl border border-zinc-300 px-3 outline-none bg-white w-full"
                  >
                    {availablePlans.map((planOpt) => (
                      <option key={planOpt} value={planOpt}>
                        {planOpt}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="grid gap-1.5 text-sm font-medium text-zinc-800 sm:col-span-1 min-w-0">
                  Monthly spend (USD)
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={tool.monthlySpend}
                    onChange={(e) => updateTool(idx, { monthlySpend: e.target.value })}
                    className="h-11 rounded-xl border border-zinc-300 px-3 outline-none w-full min-w-0"
                    placeholder="420"
                    required
                  />
                </label>

                <div className="flex gap-2 items-center sm:col-span-1 min-w-0">
                  <label className="grid gap-1.5 text-sm font-medium text-zinc-800 w-full min-w-0">
                    Seats
                    <input
                      type="number"
                      min="0"
                      value={tool.seats}
                      onChange={(e) => updateTool(idx, { seats: e.target.value })}
                      className="h-11 rounded-xl border border-zinc-300 px-3 outline-none w-full min-w-0"
                      placeholder="10"
                    />
                  </label>
                  <button type="button" onClick={() => removeTool(idx)} className="ml-2 mt-1 text-sm text-red-600">
                    Remove
                  </button>
                </div>
              </div>
            );
          })}

          <div>
            <button type="button" onClick={addTool} className="text-sm font-medium text-zinc-700 underline">+ Add tool</button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-1.5 text-sm font-medium text-zinc-800">
              Team size (optional)
              <input type="number" min="1" value={teamSize} onChange={(e) => setTeamSize(e.target.value)} className="h-11 rounded-xl border border-zinc-300 px-3 outline-none" placeholder="35" />
            </label>

            <label className="grid gap-1.5 text-sm font-medium text-zinc-800">
              Primary use case
              <select value={primaryUseCase} onChange={(e) => setPrimaryUseCase(e.target.value)} className="h-11 rounded-xl border border-zinc-300 bg-white px-3 outline-none" required>
                <option value="">Select use case</option>
                <option value="coding">Coding</option>
                <option value="content">Content creation</option>
                <option value="support">Support operations</option>
                <option value="design">Design and media</option>
                <option value="research">Research and analysis</option>
                <option value="mixed">Mixed team usage</option>
              </select>
            </label>
          </div>
        </div>

        <Button type="submit" size="lg" disabled={!isFormValid || isLoadingEstimate} className="mt-6 h-11 w-full bg-zinc-950 text-white hover:bg-zinc-800">
          {isLoadingEstimate ? "Computing..." : "Show Overspending Estimate"}
        </Button>

        {submitMessage ? <p className="mt-3 text-sm text-zinc-600">{submitMessage}</p> : null}
      </form>

      <aside className="rounded-3xl border border-zinc-900/10 bg-zinc-950 p-6 text-zinc-100 sm:p-8">
        <h3 className="text-xl font-black">Value Preview</h3>
        {!result ? (
          <p className="mt-4 text-sm text-zinc-300">Enter your inputs to reveal estimated savings range and spend efficiency.</p>
        ) : (
          <>
            <div className="mt-5 grid gap-3 text-sm">
              <div className="rounded-xl border border-white/15 bg-white/5 p-3">Tools detected: <strong>{result.toolCount}</strong></div>
              <div className="rounded-xl border border-white/15 bg-white/5 p-3">Total monthly spend: <strong>${result.totalMonthlySpend.toFixed(2)}</strong></div>
              <div className="rounded-xl border border-emerald-300/25 bg-emerald-300/10 p-3 text-emerald-100">Actionable monthly savings: <strong>${result.actionableMonthlySavings.toFixed(2)}</strong></div>
              <div className="rounded-xl border border-emerald-300/25 bg-emerald-300/10 p-3 text-emerald-100">Actionable annual savings: <strong>${result.actionableAnnualSavings.toFixed(2)}</strong></div>
              <div className="rounded-xl border border-white/15 bg-white/5 p-3">Spend efficiency score: <strong>{result.efficiencyScore}/100</strong></div>
            </div>

            <div className="mt-6 rounded-xl border border-white/15 bg-white/5 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-300">Executive Summary</p>
              {isLoadingSummary ? (
                <p className="mt-3 text-sm text-zinc-300">Generating concise summary…</p>
              ) : summary ? (
                <p className="mt-3 text-sm text-zinc-200">{summary.text}</p>
              ) : (
                <p className="mt-3 text-sm text-zinc-300">No summary available. The audit detected the highlights above.</p>
              )}
            </div>

            <div className="mt-6 rounded-2xl border border-white/15 bg-white/5 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-300">Recommendations</p>
              {result.recommendations.length > 0 ? (
                <div className="mt-3 space-y-3">
                  {result.recommendations.map((rec) => (
                    <div key={rec.title} className="rounded-xl border border-white/10 bg-black/20 p-3">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="font-semibold text-white">{rec.title}</p>
                          <p className="mt-1 text-sm text-zinc-300">{rec.explanation}</p>
                        </div>
                        <div className="text-right text-sm text-zinc-300">
                          <p>${rec.monthlySavings.toFixed(2)}/mo</p>
                          <p>{rec.confidence} confidence</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-3 text-sm text-zinc-300">No actionable savings were identified for this configuration. That usually means the selected plan mix is already efficient or the current stack does not have a clear consolidation path.</p>
              )}
            </div>

            <div className="mt-6 rounded-2xl border border-white/15 bg-white/5 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-300">Overlap Analysis</p>
              <p className="mt-2 text-sm text-zinc-200">Risk: <strong>{result.overlapAnalysis.riskLevel}</strong> ({result.overlapAnalysis.riskScore}/100)</p>
              {result.overlapAnalysis.detectedPatterns.length > 0 ? (
                <ul className="mt-2 space-y-1 text-sm text-zinc-300">
                  {result.overlapAnalysis.detectedPatterns.map((pattern) => (
                    <li key={pattern}>• {pattern}</li>
                  ))}
                </ul>
              ) : null}
            </div>

            <div className="mt-6 rounded-2xl border border-white/15 bg-white/5 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-300">Scoring</p>
              <p className="mt-2 text-sm text-zinc-200">Efficiency score: <strong>{result.scoring.efficiencyScore}/100</strong></p>
              {result.scoring.optimizationIndicators.length > 0 ? (
                <ul className="mt-2 space-y-1 text-sm text-zinc-300">
                  {result.scoring.optimizationIndicators.map((indicator) => (
                    <li key={indicator}>• {indicator}</li>
                  ))}
                </ul>
              ) : null}
            </div>

            {shareUrl ? (
              <div className="mt-6 space-y-3 rounded-2xl border border-blue-300/25 bg-blue-300/10 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-200">Shareable Link</p>
                <div className="flex gap-2 items-center">
                  <input type="text" value={shareUrl} readOnly className="h-11 flex-1 rounded-xl border border-blue-400/50 bg-blue-900/20 px-3 text-blue-100 text-sm outline-none" />
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(shareUrl);
                      setSubmitMessage("Link copied to clipboard!");
                    }}
                    className="h-11 px-4 rounded-xl border border-blue-400/50 bg-blue-500 text-white text-sm font-medium hover:bg-blue-600"
                  >
                    Copy
                  </button>
                </div>
              </div>
            ) : (
              <button type="button" onClick={handleGenerateShare} className="mt-6 w-full h-11 px-4 rounded-xl border border-white/20 bg-white/10 text-white text-sm font-medium hover:bg-white/15">
                Generate Shareable Link
              </button>
            )}

            <form onSubmit={handleEmailCapture} className="mt-6 space-y-3 rounded-2xl border border-white/15 bg-white/5 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-300">Step 2: Get Full Report</p>
              <label className="grid gap-1.5 text-sm font-medium text-zinc-100">
                Work email (captured after value is shown)
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="h-11 rounded-xl border border-zinc-600 bg-zinc-900 px-3 text-zinc-100 outline-none transition focus:border-zinc-400" placeholder="team@company.com" required />
              </label>
              <Button type="submit" size="lg" disabled={isCapturingLead} className="h-11 w-full bg-(--color-hero-accent) text-zinc-950 hover:brightness-95">{isCapturingLead ? "Sending..." : "Email Me The Full Breakdown"}</Button>
            </form>
          </>
        )}
      </aside>
    </div>
  );
}
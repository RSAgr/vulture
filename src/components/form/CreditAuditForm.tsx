"use client";

import { FormEvent, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";

type FormState = {
  toolsPaidFor: string;
  planType: string;
  monthlySpend: string;
  teamSize: string;
  primaryUseCase: string;
};

type AuditResult = {
  toolCount: number;
  overlapWaste: number;
  seatWaste: number;
  potentialSavingsLow: number;
  potentialSavingsHigh: number;
  efficiencyScore: number;
};

const initialState: FormState = {
  toolsPaidFor: "",
  planType: "",
  monthlySpend: "",
  teamSize: "",
  primaryUseCase: "",
};

function toNumber(value: string): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export default function CreditAuditForm() {
  const [form, setForm] = useState<FormState>(initialState);
  const [email, setEmail] = useState("");
  const [result, setResult] = useState<AuditResult | null>(null);
  const [isCapturingLead, setIsCapturingLead] = useState(false);
  const [submitMessage, setSubmitMessage] = useState("");

  const isFormValid = useMemo(() => {
    return (
      form.toolsPaidFor.trim().length > 0 &&
      form.planType.trim().length > 0 &&
      toNumber(form.monthlySpend) > 0 &&
      toNumber(form.teamSize) > 0 &&
      form.primaryUseCase.trim().length > 0
    );
  }, [form]);

  function calculateOverspending(): AuditResult {
    const tools = form.toolsPaidFor
      .split(",")
      .map((tool) => tool.trim())
      .filter(Boolean);

    const toolCount = Math.max(tools.length, 1);
    const monthlySpend = toNumber(form.monthlySpend);
    const teamSize = toNumber(form.teamSize);

    const planAdjustment: Record<string, number> = {
      starter: 0,
      pro: 0.03,
      business: 0.05,
      enterprise: 0.08,
    };

    const useCaseAdjustment: Record<string, number> = {
      coding: 0.04,
      content: 0.03,
      support: 0.025,
      design: 0.03,
      research: 0.02,
      mixed: 0.035,
    };

    const overlapRate = clamp(
      0.08 +
        (toolCount - 1) * 0.07 +
        (planAdjustment[form.planType] ?? 0) +
        (useCaseAdjustment[form.primaryUseCase] ?? 0),
      0.08,
      0.48
    );

    const seatWasteRate = clamp(0.03 + Math.min(teamSize / 250, 0.12), 0.03, 0.15);

    const overlapWaste = monthlySpend * overlapRate;
    const seatWaste = monthlySpend * seatWasteRate;
    const potentialSavingsHigh = overlapWaste + seatWaste;
    const potentialSavingsLow = potentialSavingsHigh * 0.62;
    const efficiencyScore = clamp(100 - Math.round((overlapRate + seatWasteRate) * 110), 34, 96);

    return {
      toolCount,
      overlapWaste,
      seatWaste,
      potentialSavingsLow,
      potentialSavingsHigh,
      efficiencyScore,
    };
  }

  function handleEstimateSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitMessage("");

    if (!isFormValid) {
      setSubmitMessage("Please fill all fields to generate your estimate.");
      return;
    }

    setResult(calculateOverspending());
  }

  async function handleEmailCapture(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
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
      const response = await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          email,
          auditSnapshot: result,
        }),
      });

      if (!response.ok) {
        throw new Error("Request failed");
      }

      setSubmitMessage("Estimate sent. We will share your detailed breakdown by email.");
    } catch {
      setSubmitMessage("Value generated, but email capture failed. Please retry.");
    } finally {
      setIsCapturingLead(false);
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
      <form
        onSubmit={handleEstimateSubmit}
        className="rounded-3xl border border-zinc-900/10 bg-white p-6 shadow-[0_16px_60px_-34px_rgba(0,0,0,0.5)] sm:p-8"
      >
        <h2 className="text-2xl font-black text-zinc-950">Company AI Spend Audit</h2>
        <p className="mt-2 text-sm text-zinc-600">
          Step 1: Enter tool and usage context. We show value first, then ask for email.
        </p>

        <div className="mt-6 grid gap-4">
          <label className="grid gap-1.5 text-sm font-medium text-zinc-800">
            AI tools you pay for
            <input
              value={form.toolsPaidFor}
              onChange={(e) => setForm((prev) => ({ ...prev, toolsPaidFor: e.target.value }))}
              className="h-11 rounded-xl border border-zinc-300 px-3 outline-none transition focus:border-zinc-500"
              placeholder="ChatGPT, Claude, Cursor"
              required
            />
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-1.5 text-sm font-medium text-zinc-800">
              Current plan
              <select
                value={form.planType}
                onChange={(e) => setForm((prev) => ({ ...prev, planType: e.target.value }))}
                className="h-11 rounded-xl border border-zinc-300 bg-white px-3 outline-none transition focus:border-zinc-500"
                required
              >
                <option value="">Select plan</option>
                <option value="starter">Starter</option>
                <option value="pro">Pro</option>
                <option value="business">Business</option>
                <option value="enterprise">Enterprise</option>
              </select>
            </label>

            <label className="grid gap-1.5 text-sm font-medium text-zinc-800">
              Team size
              <input
                type="number"
                min="1"
                value={form.teamSize}
                onChange={(e) => setForm((prev) => ({ ...prev, teamSize: e.target.value }))}
                className="h-11 rounded-xl border border-zinc-300 px-3 outline-none transition focus:border-zinc-500"
                placeholder="35"
                required
              />
            </label>
          </div>

          <label className="grid gap-1.5 text-sm font-medium text-zinc-800">
            Monthly spend on AI tools (USD)
            <input
              type="number"
              min="1"
              step="0.01"
              value={form.monthlySpend}
              onChange={(e) => setForm((prev) => ({ ...prev, monthlySpend: e.target.value }))}
              className="h-11 rounded-xl border border-zinc-300 px-3 outline-none transition focus:border-zinc-500"
              placeholder="4200"
              required
            />
          </label>

          <label className="grid gap-1.5 text-sm font-medium text-zinc-800">
            Primary use case
            <select
              value={form.primaryUseCase}
              onChange={(e) => setForm((prev) => ({ ...prev, primaryUseCase: e.target.value }))}
              className="h-11 rounded-xl border border-zinc-300 bg-white px-3 outline-none transition focus:border-zinc-500"
              required
            >
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

        <Button
          type="submit"
          size="lg"
          disabled={!isFormValid}
          className="mt-6 h-11 w-full bg-zinc-950 text-white hover:bg-zinc-800"
        >
          Show Overspending Estimate
        </Button>

        {submitMessage ? <p className="mt-3 text-sm text-zinc-600">{submitMessage}</p> : null}
      </form>

      <aside className="rounded-3xl border border-zinc-900/10 bg-zinc-950 p-6 text-zinc-100 sm:p-8">
        <h3 className="text-xl font-black">Value Preview</h3>
        {!result ? (
          <p className="mt-4 text-sm text-zinc-300">
            Enter your inputs to reveal estimated savings range and spend efficiency.
          </p>
        ) : (
          <>
            <div className="mt-5 grid gap-3 text-sm">
              <div className="rounded-xl border border-white/15 bg-white/5 p-3">
                Tools detected: <strong>{result.toolCount}</strong>
              </div>
              <div className="rounded-xl border border-white/15 bg-white/5 p-3">
                Estimated overlap waste: <strong>${result.overlapWaste.toFixed(2)}</strong>
              </div>
              <div className="rounded-xl border border-white/15 bg-white/5 p-3">
                Estimated seat under-utilization waste: <strong>${result.seatWaste.toFixed(2)}</strong>
              </div>
              <div className="rounded-xl border border-white/15 bg-white/5 p-3">
                Spend efficiency score: <strong>{result.efficiencyScore}/100</strong>
              </div>
              <div className="rounded-xl border border-emerald-300/25 bg-emerald-300/10 p-3 text-emerald-100">
                Potential monthly savings: <strong>${result.potentialSavingsLow.toFixed(2)} - ${result.potentialSavingsHigh.toFixed(2)}</strong>
              </div>
            </div>

            <form onSubmit={handleEmailCapture} className="mt-6 space-y-3 rounded-2xl border border-white/15 bg-white/5 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-300">Step 2: Get Full Report</p>
              <label className="grid gap-1.5 text-sm font-medium text-zinc-100">
                Work email (captured after value is shown)
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-11 rounded-xl border border-zinc-600 bg-zinc-900 px-3 text-zinc-100 outline-none transition focus:border-zinc-400"
                  placeholder="team@company.com"
                  required
                />
              </label>
              <Button
                type="submit"
                size="lg"
                disabled={isCapturingLead}
                className="h-11 w-full bg-(--color-hero-accent) text-zinc-950 hover:brightness-95"
              >
                {isCapturingLead ? "Sending..." : "Email Me The Full Breakdown"}
              </Button>
            </form>
          </>
        )}
      </aside>
    </div>
  );
}
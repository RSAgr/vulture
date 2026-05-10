import {
  getPlanPrice,
  normalizePlanName,
  normalizeToolName,
} from "@/lib/audit-engine/pricing-data";
import { detectOverlap, type OverlapAnalysis } from "@/lib/audit-engine/overlap-detector";
import {
  generateRecommendations,
  type AuditRecommendation,
  type EvaluatorTool,
} from "@/lib/audit-engine/recommendation-rules";
import { computeScoring, type ScoringResult } from "@/lib/audit-engine/scoring";

export type EvaluatorInputTool = {
  name: string;
  plan?: string;
  monthlySpend: number;
  seats?: number;
};

export type EvaluatorInput = {
  tools: EvaluatorInputTool[];
  primaryUseCase: string;
  teamSize?: number;
};

export type DeterministicAuditResult = {
  toolCount: number;
  totalMonthlySpend: number;
  actionableMonthlySavings: number;
  actionableAnnualSavings: number;
  recommendations: AuditRecommendation[];
  overlapAnalysis: OverlapAnalysis;
  scoring: ScoringResult;
  // Legacy compatibility fields retained for existing UI callers.
  overlapWaste: number;
  seatWaste: number;
  potentialSavingsLow: number;
  potentialSavingsHigh: number;
  efficiencyScore: number;
};

function toCurrency(value: number): number {
  return Number(Math.max(0, value).toFixed(2));
}

function buildEvaluatorTools(input: EvaluatorInput): EvaluatorTool[] {
  const fallbackSeats = input.teamSize && input.teamSize > 0 ? input.teamSize : 1;

  return input.tools.map((tool) => {
    const canonicalTool = normalizeToolName(tool.name);
    const seats = Math.max(1, tool.seats ?? fallbackSeats);

    if (!canonicalTool) {
      return {
        originalName: tool.name,
        canonicalTool: undefined,
        plan: tool.plan,
        seats,
        monthlySpend: tool.monthlySpend,
        effectiveMonthlyCost: tool.monthlySpend,
      };
    }

    const normalizedPlan = normalizePlanName(canonicalTool, tool.plan);
    const catalogUnitPrice = getPlanPrice(canonicalTool, normalizedPlan);
    const pricedCost = catalogUnitPrice !== undefined ? catalogUnitPrice * seats : undefined;

    return {
      originalName: tool.name,
      canonicalTool,
      plan: normalizedPlan ?? tool.plan,
      seats,
      monthlySpend: tool.monthlySpend,
      effectiveMonthlyCost: pricedCost ?? tool.monthlySpend,
    };
  });
}

export function evaluateAudit(input: EvaluatorInput): DeterministicAuditResult {
  const evaluatorTools = buildEvaluatorTools(input);
  const overlapAnalysis = detectOverlap(
    evaluatorTools.map((tool) => ({
      originalName: tool.originalName,
      canonicalTool: tool.canonicalTool,
      effectiveMonthlyCost: tool.effectiveMonthlyCost,
    }))
  );

  const recommendations = generateRecommendations(evaluatorTools);
  const actionableMonthlySavings = toCurrency(
    recommendations.reduce((sum, recommendation) => sum + recommendation.monthlySavings, 0)
  );

  const scoring = computeScoring({
    toolCount: evaluatorTools.length,
    primaryUseCase: input.primaryUseCase,
    overlapRiskScore: overlapAnalysis.riskScore,
    capabilityOverlapCount: overlapAnalysis.capabilityClusters.length,
  });

  const totalMonthlySpend = toCurrency(
    input.tools.reduce((sum, tool) => sum + Math.max(0, tool.monthlySpend), 0)
  );

  const overlapSavings = toCurrency(
    recommendations
      .filter((recommendation) => recommendation.type === "duplicate-tooling" || recommendation.type === "redundancy")
      .reduce((sum, recommendation) => sum + recommendation.monthlySavings, 0)
  );

  const seatSavings = toCurrency(
    recommendations
      .filter((recommendation) => recommendation.type === "plan-downgrade")
      .reduce((sum, recommendation) => sum + recommendation.monthlySavings, 0)
  );

  return {
    toolCount: evaluatorTools.length,
    totalMonthlySpend,
    actionableMonthlySavings,
    actionableAnnualSavings: toCurrency(actionableMonthlySavings * 12),
    recommendations,
    overlapAnalysis,
    scoring,
    overlapWaste: overlapSavings,
    seatWaste: seatSavings,
    potentialSavingsLow: actionableMonthlySavings,
    potentialSavingsHigh: actionableMonthlySavings,
    efficiencyScore: scoring.efficiencyScore,
  };
}

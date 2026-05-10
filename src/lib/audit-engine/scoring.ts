export type ScoringInput = {
  toolCount: number;
  primaryUseCase: string;
  overlapRiskScore: number;
  capabilityOverlapCount: number;
};

export type ScoringResult = {
  efficiencyScore: number;
  overlapRisk: number;
  optimizationIndicators: string[];
  heuristicOverlapRate: number;
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function computeScoring(input: ScoringInput): ScoringResult {
  const useCaseAdjustment: Record<string, number> = {
    coding: 0.04,
    content: 0.03,
    support: 0.025,
    design: 0.03,
    research: 0.02,
    mixed: 0.035,
  };

  const toolFactor = Math.max(0, input.toolCount - 1) * 0.07;
  const overlapRiskFactor = (input.overlapRiskScore / 100) * 0.16;
  const capabilityFactor = Math.min(0.15, input.capabilityOverlapCount * 0.03);
  const useCaseFactor = useCaseAdjustment[input.primaryUseCase] ?? 0;

  const heuristicOverlapRate = clamp(0.08 + toolFactor + overlapRiskFactor + capabilityFactor + useCaseFactor, 0.08, 0.5);
  const efficiencyScore = clamp(100 - Math.round((heuristicOverlapRate + overlapRiskFactor) * 95), 35, 96);

  const optimizationIndicators: string[] = [];
  if (input.toolCount >= 3) optimizationIndicators.push("multi-tool stack complexity");
  if (input.overlapRiskScore >= 50) optimizationIndicators.push("high functional overlap risk");
  if (input.capabilityOverlapCount >= 2) optimizationIndicators.push("capability redundancy clusters");

  return {
    efficiencyScore,
    overlapRisk: input.overlapRiskScore,
    optimizationIndicators,
    heuristicOverlapRate: Number(heuristicOverlapRate.toFixed(4)),
  };
}

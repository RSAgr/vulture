import {
  findLowerTierPaidPlan,
  getPlanPrice,
  normalizePlanName,
  type CanonicalTool,
} from "@/lib/audit-engine/pricing-data";

export type RecommendationSeverity = "low" | "medium" | "high";
export type RecommendationConfidence = "low" | "medium" | "high";
export type RecommendationType = "plan-downgrade" | "duplicate-tooling" | "redundancy";

export type EvaluatorTool = {
  originalName: string;
  canonicalTool?: CanonicalTool;
  plan?: string;
  seats: number;
  monthlySpend: number;
  effectiveMonthlyCost: number;
};

export type AuditRecommendation = {
  title: string;
  explanation: string;
  monthlySavings: number;
  annualSavings: number;
  confidence: RecommendationConfidence;
  severity: RecommendationSeverity;
  type: RecommendationType;
};

function toCurrency(value: number): number {
  return Number(Math.max(0, value).toFixed(2));
}

function severityFromSavings(monthlySavings: number): RecommendationSeverity {
  if (monthlySavings >= 100) return "high";
  if (monthlySavings >= 40) return "medium";
  return "low";
}

function buildRecommendation(
  title: string,
  explanation: string,
  monthlySavings: number,
  confidence: RecommendationConfidence,
  type: RecommendationType
): AuditRecommendation | null {
  const roundedMonthly = toCurrency(monthlySavings);
  if (roundedMonthly <= 0) return null;

  return {
    title,
    explanation,
    monthlySavings: roundedMonthly,
    annualSavings: toCurrency(roundedMonthly * 12),
    confidence,
    severity: severityFromSavings(roundedMonthly),
    type,
  };
}

function getCombinedCost(tools: EvaluatorTool[], canonicalTool: CanonicalTool): number {
  return tools
    .filter((tool) => tool.canonicalTool === canonicalTool)
    .reduce((sum, tool) => sum + tool.effectiveMonthlyCost, 0);
}

export function generateRecommendations(tools: EvaluatorTool[]): AuditRecommendation[] {
  const recommendations: AuditRecommendation[] = [];

  for (const tool of tools) {
    if (!tool.canonicalTool) continue;

    const normalizedPlan = normalizePlanName(tool.canonicalTool, tool.plan);

    // Rule: ChatGPT Team with <=2 seats should be Plus.
    if (tool.canonicalTool === "ChatGPT" && normalizedPlan === "Team" && tool.seats <= 2) {
      const targetPrice = (getPlanPrice("ChatGPT", "Plus") ?? 0) * tool.seats;
      const savings = tool.effectiveMonthlyCost - targetPrice;
      const recommendation = buildRecommendation(
        "Downgrade ChatGPT Team to Plus for tiny team",
        `ChatGPT Team is usually justified for broader collaboration. With ${tool.seats} seat(s), Plus is typically sufficient.`,
        savings,
        "high",
        "plan-downgrade"
      );
      if (recommendation) recommendations.push(recommendation);
    }

    // Rule: Enterprise/Business plans on tiny teams should be downgraded.
    if (normalizedPlan && ["Enterprise", "Business"].includes(normalizedPlan) && tool.seats <= 3) {
      const targetPlan = findLowerTierPaidPlan(tool.canonicalTool, normalizedPlan);
      if (targetPlan) {
        const targetCost = (getPlanPrice(tool.canonicalTool, targetPlan) ?? 0) * tool.seats;
        const savings = tool.effectiveMonthlyCost - targetCost;
        const recommendation = buildRecommendation(
          `Right-size ${tool.originalName} plan for small team`,
          `${tool.originalName} is on ${normalizedPlan} with ${tool.seats} seat(s). ${targetPlan} should cover this team size more cost-effectively.`,
          savings,
          "high",
          "plan-downgrade"
        );
        if (recommendation) recommendations.push(recommendation);
      }
    }

    // Rule: Detect potential overpayment or data entry discrepancy.
    // If reported spend is significantly higher than catalog pricing, recommend verification.
    const catalogCost = tool.effectiveMonthlyCost;
    const reportedCost = tool.monthlySpend;
    const discrepancy = reportedCost - catalogCost;
    if (discrepancy > 50) {
      const recommendation = buildRecommendation(
        `Verify ${tool.originalName} billing accuracy`,
        `Your reported spend ($${reportedCost.toFixed(2)}) is significantly higher than the expected catalog cost for ${tool.originalName} ${normalizedPlan || "Free"} with ${tool.seats} seat(s) ($${catalogCost.toFixed(2)}). This could indicate custom pricing, overages, or data entry error. We recommend reviewing your invoice.`,
        discrepancy,
        "medium",
        "plan-downgrade"
      );
      if (recommendation) recommendations.push(recommendation);
    }
  }

  const hasCursor = tools.some((tool) => tool.canonicalTool === "Cursor");
  const hasCopilot = tools.some((tool) => tool.canonicalTool === "Copilot");

  if (hasCursor && hasCopilot) {
    const cursorCost = getCombinedCost(tools, "Cursor");
    const copilotCost = getCombinedCost(tools, "Copilot");
    const duplicateCost = Math.min(cursorCost, copilotCost);

    const recommendation = buildRecommendation(
      "Consolidate coding assistants",
      "Cursor and Copilot overlap heavily for coding assistance. Standardizing on one can remove duplicate spend.",
      duplicateCost,
      "medium",
      "duplicate-tooling"
    );
    if (recommendation) recommendations.push(recommendation);
  }

  const hasChatGPT = tools.some((tool) => tool.canonicalTool === "ChatGPT");
  const hasClaude = tools.some((tool) => tool.canonicalTool === "Claude");
  const hasGemini = tools.some((tool) => tool.canonicalTool === "Gemini");

  if (hasChatGPT && hasClaude && hasGemini) {
    const triple = ["ChatGPT", "Claude", "Gemini"] as const;
    const costs = triple.map((name) => ({
      name,
      cost: getCombinedCost(tools, name),
    }));

    const total = costs.reduce((sum, c) => sum + c.cost, 0);
    const keep = Math.max(...costs.map((c) => c.cost));
    const savings = total - keep;

    const recommendation = buildRecommendation(
      "Reduce general-purpose LLM redundancy",
      "ChatGPT, Claude, and Gemini are all active. Consolidating to one primary general-purpose assistant removes redundant licenses.",
      savings,
      "medium",
      "redundancy"
    );
    if (recommendation) recommendations.push(recommendation);
  }

  // Remove duplicate titles and keep highest savings variant.
  const bestByTitle = new Map<string, AuditRecommendation>();
  for (const recommendation of recommendations) {
    const existing = bestByTitle.get(recommendation.title);
    if (!existing || recommendation.monthlySavings > existing.monthlySavings) {
      bestByTitle.set(recommendation.title, recommendation);
    }
  }

  return Array.from(bestByTitle.values()).sort((a, b) => b.monthlySavings - a.monthlySavings);
}

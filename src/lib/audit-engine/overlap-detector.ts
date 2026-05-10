import { getCapabilities, type CanonicalTool } from "@/lib/audit-engine/pricing-data";

export type OverlapInputTool = {
  originalName: string;
  canonicalTool?: CanonicalTool;
  effectiveMonthlyCost: number;
};

export type CapabilityCluster = {
  capability: string;
  tools: string[];
  monthlyExposure: number;
};

export type OverlapAnalysis = {
  riskLevel: "low" | "medium" | "high";
  riskScore: number;
  capabilityClusters: CapabilityCluster[];
  detectedPatterns: string[];
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function detectOverlap(tools: OverlapInputTool[]): OverlapAnalysis {
  const capabilityToTools = new Map<string, Set<string>>();
  const capabilityExposure = new Map<string, number>();

  for (const tool of tools) {
    if (!tool.canonicalTool) continue;

    for (const capability of getCapabilities(tool.canonicalTool)) {
      if (!capabilityToTools.has(capability)) {
        capabilityToTools.set(capability, new Set<string>());
      }
      capabilityToTools.get(capability)?.add(tool.originalName);
      capabilityExposure.set(capability, (capabilityExposure.get(capability) ?? 0) + tool.effectiveMonthlyCost);
    }
  }

  const capabilityClusters: CapabilityCluster[] = Array.from(capabilityToTools.entries())
    .filter(([, toolSet]) => toolSet.size > 1)
    .map(([capability, toolSet]) => ({
      capability,
      tools: Array.from(toolSet),
      monthlyExposure: Number((capabilityExposure.get(capability) ?? 0).toFixed(2)),
    }));

  const toolSet = new Set(tools.map((t) => t.canonicalTool).filter(Boolean));
  const detectedPatterns: string[] = [];

  if (toolSet.has("Cursor") && toolSet.has("Copilot")) {
    detectedPatterns.push("Cursor + Copilot coding assistant overlap");
  }

  if (toolSet.has("ChatGPT") && toolSet.has("Claude") && toolSet.has("Gemini")) {
    detectedPatterns.push("General-purpose LLM redundancy across ChatGPT, Claude, and Gemini");
  }

  let riskScore = 8;
  riskScore += capabilityClusters.reduce((acc, cluster) => acc + (cluster.tools.length - 1) * 12, 0);
  riskScore += detectedPatterns.length * 18;
  riskScore = clamp(Math.round(riskScore), 0, 100);

  const riskLevel: OverlapAnalysis["riskLevel"] = riskScore >= 60 ? "high" : riskScore >= 30 ? "medium" : "low";

  return {
    riskLevel,
    riskScore,
    capabilityClusters,
    detectedPatterns,
  };
}

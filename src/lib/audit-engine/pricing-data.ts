export type CanonicalTool = "ChatGPT" | "Claude" | "Cursor" | "Copilot" | "Gemini" | "Windsurf";

export type CatalogEntry = {
  tool: CanonicalTool;
  planOrder: string[];
  planPricingUSD: Record<string, number>;
  capabilities: string[];
  aliases: string[];
};

export const PRICING_CATALOG: Record<CanonicalTool, CatalogEntry> = {
  ChatGPT: {
    tool: "ChatGPT",
    planOrder: ["Free", "Plus", "Pro", "Team", "Enterprise"],
    planPricingUSD: {
      Free: 0,
      Plus: 20,
      Pro: 200,
      Team: 30,
      Enterprise: 60,
    },
    capabilities: ["general-purpose", "reasoning", "writing", "coding"],
    aliases: ["chatgpt", "openai", "gpt"],
  },
  Claude: {
    tool: "Claude",
    planOrder: ["Free", "Pro", "Team", "Enterprise"],
    planPricingUSD: {
      Free: 0,
      Pro: 20,
      Team: 30,
      Enterprise: 55,
    },
    capabilities: ["reasoning", "writing", "general-purpose"],
    aliases: ["claude", "anthropic"],
  },
  Cursor: {
    tool: "Cursor",
    planOrder: ["Free", "Pro", "Business", "Enterprise"],
    planPricingUSD: {
      Free: 0,
      Pro: 20,
      Business: 40,
      Enterprise: 60,
    },
    capabilities: ["coding"],
    aliases: ["cursor"],
  },
  Copilot: {
    tool: "Copilot",
    planOrder: ["Free", "Pro", "Business", "Enterprise"],
    planPricingUSD: {
      Free: 0,
      Pro: 10,
      Business: 19,
      Enterprise: 39,
    },
    capabilities: ["coding"],
    aliases: ["copilot", "github copilot", "microsoft copilot"],
  },
  Gemini: {
    tool: "Gemini",
    planOrder: ["Free", "Advanced", "Business", "Enterprise"],
    planPricingUSD: {
      Free: 0,
      Advanced: 20,
      Business: 30,
      Enterprise: 50,
    },
    capabilities: ["general-purpose", "research", "writing"],
    aliases: ["gemini", "google gemini"],
  },
  Windsurf: {
    tool: "Windsurf",
    planOrder: ["Free", "Pro", "Team", "Enterprise"],
    planPricingUSD: {
      Free: 0,
      Pro: 15,
      Team: 30,
      Enterprise: 50,
    },
    capabilities: ["coding"],
    aliases: ["windsurf", "codeium", "codeium windsurf"],
  },
};

const TOOL_LOOKUP = new Map<string, CanonicalTool>();

for (const [tool, catalog] of Object.entries(PRICING_CATALOG) as Array<[CanonicalTool, CatalogEntry]>) {
  TOOL_LOOKUP.set(tool.toLowerCase(), tool);
  for (const alias of catalog.aliases) {
    TOOL_LOOKUP.set(alias.toLowerCase(), tool);
  }
}

export function normalizeToolName(name: string): CanonicalTool | undefined {
  return TOOL_LOOKUP.get(name.trim().toLowerCase());
}

export function normalizePlanName(tool: CanonicalTool, plan?: string): string | undefined {
  if (!plan) return undefined;
  const normalized = plan.trim().toLowerCase();
  const catalog = PRICING_CATALOG[tool];
  return catalog.planOrder.find((p) => p.toLowerCase() === normalized);
}

export function getPlanPrice(tool: CanonicalTool, plan?: string): number | undefined {
  const normalizedPlan = normalizePlanName(tool, plan);
  if (!normalizedPlan) return undefined;
  return PRICING_CATALOG[tool].planPricingUSD[normalizedPlan];
}

export function getCapabilities(tool: CanonicalTool): string[] {
  return PRICING_CATALOG[tool].capabilities;
}

export function findLowerTierPaidPlan(tool: CanonicalTool, currentPlan?: string): string | undefined {
  const current = normalizePlanName(tool, currentPlan);
  const planOrder = PRICING_CATALOG[tool].planOrder;

  if (!current) {
    return planOrder.find((plan) => PRICING_CATALOG[tool].planPricingUSD[plan] > 0);
  }

  const currentIdx = planOrder.indexOf(current);
  if (currentIdx <= 0) return undefined;

  for (let i = currentIdx - 1; i >= 0; i -= 1) {
    const candidate = planOrder[i];
    if (PRICING_CATALOG[tool].planPricingUSD[candidate] > 0) {
      return candidate;
    }
  }

  return undefined;
}

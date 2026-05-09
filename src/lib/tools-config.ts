// Real AI tool options with their actual pricing tiers
export const TOOL_OPTIONS = [
  "ChatGPT",
  "Claude",
  "GitHub Copilot",
  "Cursor",
  "Gemini",
  "Perplexity",
  "Microsoft Copilot",
  "Other",
] as const;

export type ToolName = (typeof TOOL_OPTIONS)[number];

// Actual plan tiers for each tool (as of 2026)
export const TOOL_PLANS: Record<ToolName, string[]> = {
  ChatGPT: ["Free", "Plus", "Pro", "Team"],
  Claude: ["Free", "Pro", "Team"],
  "GitHub Copilot": ["Free", "Pro", "Business"],
  Cursor: ["Free", "Pro"],
  Gemini: ["Free", "Advanced"],
  Perplexity: ["Free", "Pro"],
  "Microsoft Copilot": ["Free", "Pro"],
  Other: ["Free", "Pro", "Enterprise"],
};

// Plan-to-pricing mapping (monthly USD) for context
export const PLAN_PRICING: Record<string, number> = {
  Free: 0,
  Plus: 20,
  Pro: 20,
  Team: 0, // custom pricing
  Advanced: 20,
  Business: 0, // custom pricing
  Enterprise: 0, // custom pricing
};

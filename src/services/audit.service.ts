import {
	evaluateAudit,
	type DeterministicAuditResult,
} from "@/lib/audit-engine/evaluator";
import type { OverlapAnalysis } from "@/lib/audit-engine/overlap-detector";
import type {
	AuditRecommendation,
} from "@/lib/audit-engine/recommendation-rules";
import type { ScoringResult } from "@/lib/audit-engine/scoring";

export type ToolEntry = {
	name: string;
	plan?: string;
	monthlySpend: string | number;
	seats?: string | number;
};

// New normalized audit input: prefer `tools` array. For backward compatibility
// we also accept the legacy shape and normalize it to this structure.
export type AuditInput = {
	tools: ToolEntry[];
	primaryUseCase: string;
	// optional total team size (kept for backward compat)
	teamSize?: string | number;
};

export type AuditResult = {
	toolCount: number;
	totalMonthlySpend: number;
	actionableMonthlySavings: number;
	actionableAnnualSavings: number;
	recommendations: AuditRecommendation[];
	overlapAnalysis: OverlapAnalysis;
	scoring: ScoringResult;

	// Legacy fields retained for existing UI and API consumers.
	overlapWaste: number;
	seatWaste: number;
	potentialSavingsLow: number;
	potentialSavingsHigh: number;
	efficiencyScore: number;
};

export type AuditSummary = {
	biggestLeak: "overlap" | "seat-utilization";
	monthlySavingsEstimate: number;
	annualSavingsEstimate: number;
};

export type AuditServiceResponse = {
	auditId: string;
	generatedAt: string;
	result: AuditResult;
	summary: AuditSummary;
};

export type ValidationOutcome<T> =
	| { ok: true; data: T }
	| { ok: false; errors: string[] };

function toNumber(value: string | number): number {
	const parsed = Number(value);
	return Number.isFinite(parsed) ? parsed : 0;
}

export function validateAuditInput(payload: unknown): ValidationOutcome<AuditInput> {
	if (!payload || typeof payload !== "object") {
		return { ok: false, errors: ["Payload must be a JSON object."] };
	}
	const data = payload as Record<string, unknown>;
	const errors: string[] = [];

	// If caller provided `tools` array, validate each entry
	if (Array.isArray(data.tools)) {
		const tools: ToolEntry[] = data.tools;
		if (tools.length === 0) {
			errors.push("tools must contain at least one tool entry.");
		} else {
			tools.forEach((t, idx) => {
				if (!t || typeof t !== "object") {
					errors.push(`tools[${idx}] must be an object.`);
					return;
				}
				if (String(t.name ?? "").trim().length === 0) {
					errors.push(`tools[${idx}].name is required.`);
				}
				if (toNumber(t.monthlySpend ?? 0) <= 0) {
					errors.push(`tools[${idx}].monthlySpend must be greater than 0.`);
				}
				if (t.seats !== undefined && toNumber(t.seats ?? 0) <= 0) {
					errors.push(`tools[${idx}].seats must be greater than 0 if provided.`);
				}
			});
		}

		if (String(data.primaryUseCase ?? "").trim().length === 0) {
			errors.push("primaryUseCase is required.");
		}

		if (errors.length > 0) {
			return { ok: false, errors };
		}

		// Normalize entries: ensure numeric fields remain numbers/strings preserved for conversion later
		const normalizedTools: ToolEntry[] = (data.tools as Record<string, unknown>[]).map((t) => {
			const rec = t as Record<string, unknown>;
			return {
				name: String(rec.name),
				plan: rec.plan ? String(rec.plan) : undefined,
				monthlySpend: (rec.monthlySpend ?? 0) as string | number,
				seats: (rec.seats ?? undefined) as string | number | undefined,
			} as ToolEntry;
		});

		return {
			ok: true,
			data: {
				tools: normalizedTools,
				primaryUseCase: String(data.primaryUseCase),
				teamSize: data.teamSize as string | number | undefined,
			},
		};
	}

	// Legacy support: accept the older single-tool-style payload and normalize
	// Expected legacy fields: toolsPaidFor (comma list), planType, monthlySpend, teamSize, primaryUseCase
	const legacyToolsStr = String(data.toolsPaidFor ?? "").trim();
	const legacyPlan = String(data.planType ?? "").trim();
	const legacyMonthly = toNumber((data.monthlySpend ?? 0) as string | number);
	const legacyTeamSize = data.teamSize as string | number | undefined;
	const primaryUseCase = String(data.primaryUseCase ?? "").trim();

	if (legacyToolsStr.length === 0) {
		errors.push("toolsPaidFor (or tools array) is required.");
	}
	if (legacyMonthly <= 0) {
		errors.push("monthlySpend must be greater than 0.");
	}
	if (legacyTeamSize !== undefined && toNumber(legacyTeamSize) <= 0) {
		errors.push("teamSize must be greater than 0 if provided.");
	}
	if (primaryUseCase.length === 0) {
		errors.push("primaryUseCase is required.");
	}

	if (errors.length > 0) {
		return { ok: false, errors };
	}

	// Create a single aggregated tool entry to preserve previous behavior
	const legacyToolNames = legacyToolsStr.split(",").map((s) => s.trim()).filter(Boolean);
		const tools: ToolEntry[] = legacyToolNames.length > 1
				? // If multiple tool names were provided, split the monthly spend evenly across them
					legacyToolNames.map((name) => ({ name, plan: legacyPlan || undefined, monthlySpend: legacyMonthly / legacyToolNames.length, seats: legacyTeamSize }))
				: [{ name: legacyToolNames[0] ?? "tools", plan: legacyPlan || undefined, monthlySpend: legacyMonthly, seats: legacyTeamSize }];

	return {
		ok: true,
		data: {
			tools,
			primaryUseCase,
			teamSize: legacyTeamSize,
		},
	};
}

export function calculateAudit(input: AuditInput): AuditResult {
	const normalized = input.tools.map((t) => ({
		name: String(t.name),
		plan: t.plan ? String(t.plan) : undefined,
		monthlySpend: toNumber(t.monthlySpend),
		seats: t.seats !== undefined ? toNumber(t.seats) : undefined,
	}));

	const evaluated: DeterministicAuditResult = evaluateAudit({
		tools: normalized,
		primaryUseCase: String(input.primaryUseCase ?? ""),
		teamSize: input.teamSize !== undefined ? toNumber(input.teamSize) : undefined,
	});

	return evaluated;
}

export function generateAudit(input: AuditInput): AuditServiceResponse {
	const result = calculateAudit(input);
	const biggestLeak = result.overlapWaste >= result.seatWaste ? "overlap" : "seat-utilization";
	const monthlySavingsEstimate = Number(result.actionableMonthlySavings.toFixed(2));

	return {
		auditId: `audit_${Date.now()}`,
		generatedAt: new Date().toISOString(),
		result,
		summary: {
			biggestLeak,
			monthlySavingsEstimate,
			annualSavingsEstimate: Number((monthlySavingsEstimate * 12).toFixed(2)),
		},
	};
}

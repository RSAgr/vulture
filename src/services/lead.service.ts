import type { AuditResult } from "@/services/audit.service";

export type LeadInput = {
	email: string;
	toolsPaidFor?: string;
	planType?: string;
	monthlySpend?: string | number;
	teamSize?: string | number;
	primaryUseCase?: string;
	auditSnapshot?: AuditResult;
};

export type LeadRecord = {
	leadId: string;
	email: string;
	capturedAt: string;
	context: {
		toolsPaidFor: string;
		planType: string;
		monthlySpend: number;
		teamSize: number;
		primaryUseCase: string;
	};
	auditSnapshot: AuditResult | null;
};

export type ValidationOutcome<T> =
	| { ok: true; data: T }
	| { ok: false; errors: string[] };

function toNumber(value: string | number | undefined): number {
	const parsed = Number(value);
	return Number.isFinite(parsed) ? parsed : 0;
}

function isValidEmail(value: string): boolean {
	return /.+@.+\..+/.test(value);
}

export function validateLeadInput(payload: unknown): ValidationOutcome<LeadInput> {
	if (!payload || typeof payload !== "object") {
		return { ok: false, errors: ["Payload must be a JSON object."] };
	}

	const data = payload as Partial<LeadInput>;
	const email = String(data.email ?? "").trim();
	const errors: string[] = [];

	if (!isValidEmail(email)) {
		errors.push("Valid email is required.");
	}

	if (errors.length > 0) {
		return { ok: false, errors };
	}

	return {
		ok: true,
		data: {
			email,
			toolsPaidFor: String(data.toolsPaidFor ?? "").trim(),
			planType: String(data.planType ?? "").trim(),
			monthlySpend: data.monthlySpend,
			teamSize: data.teamSize,
			primaryUseCase: String(data.primaryUseCase ?? "").trim(),
			auditSnapshot: data.auditSnapshot,
		},
	};
}

export function createLead(input: LeadInput): LeadRecord {
	return {
		leadId: `lead_${Date.now()}`,
		email: input.email,
		capturedAt: new Date().toISOString(),
		context: {
			toolsPaidFor: input.toolsPaidFor ?? "",
			planType: input.planType ?? "",
			monthlySpend: toNumber(input.monthlySpend),
			teamSize: toNumber(input.teamSize),
			primaryUseCase: input.primaryUseCase ?? "",
		},
		auditSnapshot: input.auditSnapshot ?? null,
	};
}

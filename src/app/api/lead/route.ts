import { NextResponse } from "next/server";

type LeadPayload = {
	email?: string;
	toolsPaidFor?: string;
	planType?: string;
	monthlySpend?: string | number;
	teamSize?: string | number;
	primaryUseCase?: string;
};

function isValidEmail(value: string): boolean {
	return /.+@.+\..+/.test(value);
}

export async function POST(request: Request) {
	let payload: LeadPayload;
	try {
		payload = (await request.json()) as LeadPayload;
	} catch {
		return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
	}

	const email = String(payload.email ?? "").trim();

	if (!isValidEmail(email)) {
		return NextResponse.json({ error: "Valid email is required." }, { status: 400 });
	}

	const leadId = `lead_${Date.now()}`;

	return NextResponse.json(
		{
			ok: true,
			leadId,
			message: "Lead captured successfully.",
		},
		{ status: 200 }
	);
}

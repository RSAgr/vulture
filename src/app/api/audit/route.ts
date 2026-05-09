import { NextResponse } from "next/server";
import { generateAudit, validateAuditInput } from "@/services/audit.service";

export async function POST(request: Request) {
	let payload: unknown;

	try {
		payload = await request.json();
	} catch {
		return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
	}

	const validation = validateAuditInput(payload);

	if (!validation.ok) {
		return NextResponse.json(
			{
				error: "Audit validation failed.",
				details: validation.errors,
			},
			{ status: 400 }
		);
	}

	try {
		const audit = generateAudit(validation.data);

		return NextResponse.json(
			{
				ok: true,
				...audit,
			},
			{ status: 200 }
		);
	} catch {
		return NextResponse.json({ error: "Failed to generate audit result." }, { status: 500 });
	}
}

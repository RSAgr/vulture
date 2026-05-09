import { NextResponse } from "next/server";
import { createLead, validateLeadInput } from "@/services/lead.service";

export async function POST(request: Request) {
	let payload: unknown;

	try {
		payload = await request.json();
	} catch {
		return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
	}

	const validation = validateLeadInput(payload);

	if (!validation.ok) {
		return NextResponse.json(
			{ error: "Lead validation failed.", details: validation.errors },
			{ status: 400 }
		);
	}

	try {
		const lead = createLead(validation.data);

		return NextResponse.json(
			{
				ok: true,
				leadId: lead.leadId,
				message: "Lead captured successfully.",
				lead,
			},
			{ status: 200 }
		);
	} catch {
		return NextResponse.json({ error: "Failed to capture lead." }, { status: 500 });
	}
}

import { NextResponse } from "next/server";
import { createShare, getShare } from "@/services/share.service";
import type { AuditResult } from "@/services/audit.service";

export async function POST(request: Request) {
  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
  }

  const data = payload as Record<string, unknown>;

  if (!data.tools || !Array.isArray(data.tools)) {
    return NextResponse.json({ error: "tools array is required." }, { status: 400 });
  }

  if (!data.primaryUseCase || typeof data.primaryUseCase !== "string") {
    return NextResponse.json({ error: "primaryUseCase is required." }, { status: 400 });
  }

  if (!data.auditResult || typeof data.auditResult !== "object") {
    return NextResponse.json({ error: "auditResult is required." }, { status: 400 });
  }

  try {
    const shared = createShare({
      tools: data.tools as Array<{ name: string; plan?: string; monthlySpend: number; seats?: number }>,
      primaryUseCase: data.primaryUseCase as string,
      teamSize: data.teamSize ? Number(data.teamSize) : undefined,
      auditResult: data.auditResult as AuditResult,
    });

    const shareUrl = `${request.headers.get("origin")}/audit/${shared.shareId}`;

    return NextResponse.json(
      {
        ok: true,
        shareId: shared.shareId,
        shareUrl,
        expiresAt: shared.expiresAt,
      },
      { status: 200 }
    );
  } catch {
    return NextResponse.json({ error: "Failed to create share." }, { status: 500 });
  }
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const shareId = url.searchParams.get("id");

  if (!shareId) {
    return NextResponse.json({ error: "Share ID is required." }, { status: 400 });
  }

  const result = getShare(shareId);

  if (!result.ok) {
    return NextResponse.json({ error: result.errors[0] }, { status: 404 });
  }

  return NextResponse.json(
    {
      ok: true,
      shared: result.data,
    },
    { status: 200 }
  );
}

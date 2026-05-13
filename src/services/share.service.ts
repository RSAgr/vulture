import type { AuditResult } from "@/services/audit.service";
import prisma from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

export type SharedAudit = {
  shareId: string;
  createdAt: string;
  expiresAt: string;
  tools: Array<{
    name: string;
    plan?: string;
    monthlySpend: number;
    seats?: number;
  }>;
  primaryUseCase: string;
  teamSize?: number;
  auditResult: AuditResult;
};

export type ValidationOutcome<T> = { ok: true; data: T } | { ok: false; errors: string[] };

function generateShareId(): string {
  return `share_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

export async function createShare(payload: {
  tools: Array<{ name: string; plan?: string; monthlySpend: number; seats?: number }>;
  primaryUseCase: string;
  teamSize?: number;
  auditResult: AuditResult;
}): Promise<SharedAudit> {
  const shareId = generateShareId();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days

  const created = await prisma.share.create({
    data: {
      shareId,
      createdAt: now,
      expiresAt,
      primaryUseCase: payload.primaryUseCase,
      teamSize: payload.teamSize ?? null,
      tools: payload.tools as Prisma.InputJsonValue,
      auditResult: payload.auditResult as Prisma.InputJsonValue,
    },
  });

  return {
    shareId: created.shareId,
    createdAt: created.createdAt.toISOString(),
    expiresAt: created.expiresAt.toISOString(),
    tools: payload.tools,
    primaryUseCase: payload.primaryUseCase,
    teamSize: payload.teamSize,
    auditResult: payload.auditResult,
  };
}

export async function getShare(shareId: string): Promise<ValidationOutcome<SharedAudit>> {
  if (!shareId || typeof shareId !== "string") {
    return { ok: false, errors: ["Invalid share ID."] };
  }

  const record = await prisma.share.findUnique({ where: { shareId } });
  if (!record) return { ok: false, errors: ["Shared audit not found."] };

  const expiresAt = new Date(record.expiresAt);
  if (new Date() > expiresAt) {
    await prisma.share.delete({ where: { shareId } });
    return { ok: false, errors: ["This shared audit has expired."] };
  }

  return {
    ok: true,
    data: {
      shareId: record.shareId,
      createdAt: record.createdAt.toISOString(),
      expiresAt: record.expiresAt.toISOString(),
      primaryUseCase: record.primaryUseCase,
      teamSize: record.teamSize ?? undefined,
      tools: record.tools as SharedAudit["tools"],
      auditResult: record.auditResult as AuditResult,
    },
  };
}

export function generateShareUrl(shareId: string): string {
  return `/audit/${shareId}`;
}

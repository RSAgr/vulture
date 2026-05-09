import type { AuditResult } from "@/services/audit.service";

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

// In-memory storage (TODO: replace with database)
const sharedAudits = new Map<string, SharedAudit>();

function generateShareId(): string {
  return `share_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

export function createShare(payload: {
  tools: Array<{ name: string; plan?: string; monthlySpend: number; seats?: number }>;
  primaryUseCase: string;
  teamSize?: number;
  auditResult: AuditResult;
}): SharedAudit {
  const shareId = generateShareId();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days

  const shared: SharedAudit = {
    shareId,
    createdAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
    tools: payload.tools,
    primaryUseCase: payload.primaryUseCase,
    teamSize: payload.teamSize,
    auditResult: payload.auditResult,
  };

  sharedAudits.set(shareId, shared);
  return shared;
}

export function getShare(shareId: string): ValidationOutcome<SharedAudit> {
  if (!shareId || typeof shareId !== "string") {
    return { ok: false, errors: ["Invalid share ID."] };
  }

  const shared = sharedAudits.get(shareId);

  if (!shared) {
    return { ok: false, errors: ["Shared audit not found."] };
  }

  const expiresAt = new Date(shared.expiresAt);
  if (new Date() > expiresAt) {
    sharedAudits.delete(shareId);
    return { ok: false, errors: ["This shared audit has expired."] };
  }

  return { ok: true, data: shared };
}

export function generateShareUrl(shareId: string): string {
  return `/audit/${shareId}`;
}

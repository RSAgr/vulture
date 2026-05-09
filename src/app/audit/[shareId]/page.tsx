"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Navbar from "@/components/common/Navbar";
import Footer from "@/components/common/Footer";
import Container from "@/components/common/Container";
import { Button } from "@/components/ui/button";

type SharedAuditData = {
  tools: Array<{
    name: string;
    plan?: string;
    monthlySpend: number;
    seats?: number;
  }>;
  primaryUseCase: string;
  teamSize?: number;
  auditResult: {
    toolCount: number;
    overlapWaste: number;
    seatWaste: number;
    potentialSavingsLow: number;
    potentialSavingsHigh: number;
    efficiencyScore: number;
  };
};

export default function SharedAuditPage() {
  const params = useParams();
  const shareId = params.shareId as string;

  const [audit, setAudit] = useState<SharedAuditData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchSharedAudit() {
      try {
        const res = await fetch(`/api/share?id=${shareId}`);
        const body = await res.json();

        if (!res.ok) {
          setError(body.error || "Failed to load shared audit.");
          return;
        }

        setAudit(body.shared);
      } catch {
        setError("Failed to fetch shared audit.");
      } finally {
        setLoading(false);
      }
    }

    fetchSharedAudit();
  }, [shareId]);

  return (
    <>
      <Navbar />
      <main className="py-12 sm:py-16">
        <Container>
          {loading && <p className="text-center text-zinc-600">Loading audit...</p>}

          {error && <p className="text-center text-red-600">{error}</p>}

          {audit && (
            <div className="max-w-4xl mx-auto">
              <div className="rounded-3xl border border-zinc-900/10 bg-white p-6 shadow-[0_16px_60px_-34px_rgba(0,0,0,0.5)] sm:p-8">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">Shared Audit Report</p>
                <h1 className="mt-2 text-4xl font-black text-zinc-950">Company AI Spend Audit</h1>
                <p className="mt-3 text-zinc-600">This audit has been shared with you for review.</p>

                <div className="mt-8 grid gap-6">
                  <div>
                    <h2 className="text-lg font-black text-zinc-950">Tools Audited</h2>
                    <div className="mt-4 space-y-3">
                      {audit.tools.map((tool, idx) => (
                        <div key={idx} className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-semibold text-zinc-900">{tool.name}</p>
                              <p className="text-sm text-zinc-600">Plan: {tool.plan || "N/A"}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold text-zinc-900">${tool.monthlySpend.toFixed(2)}/mo</p>
                              <p className="text-sm text-zinc-600">{tool.seats || 0} seats</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h2 className="text-lg font-black text-zinc-950">Audit Results</h2>
                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
                        <p className="text-sm text-zinc-600">Tools Detected</p>
                        <p className="mt-1 text-2xl font-bold text-zinc-900">{audit.auditResult.toolCount}</p>
                      </div>
                      <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
                        <p className="text-sm text-zinc-600">Efficiency Score</p>
                        <p className="mt-1 text-2xl font-bold text-zinc-900">{audit.auditResult.efficiencyScore}/100</p>
                      </div>
                      <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
                        <p className="text-sm text-zinc-600">Overlap Waste</p>
                        <p className="mt-1 text-2xl font-bold text-zinc-900">${audit.auditResult.overlapWaste.toFixed(2)}</p>
                      </div>
                      <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
                        <p className="text-sm text-zinc-600">Seat Utilization Waste</p>
                        <p className="mt-1 text-2xl font-bold text-zinc-900">${audit.auditResult.seatWaste.toFixed(2)}</p>
                      </div>
                      <div className="sm:col-span-2 rounded-xl border border-emerald-300/25 bg-emerald-300/10 p-4 text-emerald-900">
                        <p className="text-sm font-semibold">Potential Monthly Savings</p>
                        <p className="mt-1 text-2xl font-bold">${audit.auditResult.potentialSavingsLow.toFixed(2)} - ${audit.auditResult.potentialSavingsHigh.toFixed(2)}</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 flex gap-3">
                    <Button asChild className="h-11 bg-zinc-950 text-white hover:bg-zinc-800">
                      <a href="/check-credits">Run Your Own Audit</a>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </Container>
      </main>
      <Footer />
    </>
  );
}

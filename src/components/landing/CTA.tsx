import Container from "@/components/common/Container";
import { Button } from "@/components/ui/button";

const proofPoints = ["Benchmarked against top SaaS pages", "Action-oriented recommendations", "Built for PM + marketer workflows"];

export default function CTA() {
  return (
    <section id="cta" className="pb-8 pt-12 sm:pb-16" aria-label="Call to action">
      <Container>
        <div id="proof" className="rounded-3xl border border-zinc-900/10 bg-white p-7 shadow-[0_20px_60px_-38px_rgba(0,0,0,0.55)] sm:p-10 reveal">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">Ready to launch</p>
          <h2 className="mt-2 text-3xl font-black text-zinc-950 sm:text-4xl">Get your first audit and roadmap today</h2>
          <p className="mt-3 max-w-2xl text-zinc-600">
            Share one URL and receive a complete conversion review with practical edits your team can implement
            immediately.
          </p>

          <ul className="mt-6 grid gap-3 text-sm text-zinc-700 sm:grid-cols-3">
            {proofPoints.map((point) => (
              <li key={point} className="rounded-xl border border-zinc-900/10 bg-zinc-50 px-4 py-3">
                {point}
              </li>
            ))}
          </ul>

          <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button asChild size="lg" className="h-11 bg-(--color-hero-accent) px-6 text-zinc-950 hover:brightness-95">
              <a href="/check-credits">Start Company Check</a>
            </Button>
            <p className="text-sm text-zinc-500">No credit card required. Typical response in less than 24 hours.</p>
          </div>
        </div>
      </Container>
    </section>
  );
}
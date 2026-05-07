import { ArrowRight, CheckCircle2 } from "lucide-react";
import Container from "@/components/common/Container";
import { Button } from "@/components/ui/button";

const stats = [
  { label: "Audits generated", value: "1,200+" },
  { label: "Avg. conversion lift", value: "+23%" },
  { label: "Time to insight", value: "< 90 sec" },
];

export default function Hero() {
  return (
    <section className="relative overflow-hidden pt-16 pb-14 sm:pt-24 sm:pb-20">
      <Container className="relative z-10">
        <div className="mx-auto max-w-3xl text-center reveal">
          <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-zinc-900/10 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-zinc-700">
            <CheckCircle2 className="size-3.5 text-emerald-600" />
            Assignment Build: Frontend Ready
          </p>

          <h1 className="text-4xl font-extrabold leading-tight text-zinc-950 sm:text-6xl">
            Turn weak product pages into
            <span className="block text-(--color-hero-accent)">conversion engines</span>
          </h1>

          <p className="mx-auto mt-5 max-w-2xl text-base text-zinc-700 sm:text-lg">
            Vulture audits your landing page, finds the conversion leaks, and returns a practical roadmap your
            team can ship this week.
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row reveal reveal-delay-1">
            <Button
              asChild
              size="lg"
              className="h-11 bg-zinc-950 px-5 text-white shadow-xl shadow-zinc-900/25 hover:bg-zinc-800"
            >
              <a href="#cta">
                Start Free Audit
                <ArrowRight className="size-4" />
              </a>
            </Button>
            <Button asChild variant="outline" size="lg" className="h-11 border-zinc-300 bg-white px-5">
              <a href="#process">See How It Works</a>
            </Button>
          </div>
        </div>

        <div className="mt-14 grid gap-4 sm:grid-cols-3 reveal reveal-delay-2">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="rounded-2xl border border-zinc-900/10 bg-white/80 p-5 text-center shadow-[0_10px_35px_-24px_rgba(0,0,0,0.45)] backdrop-blur"
            >
              <p className="text-2xl font-black text-zinc-900">{stat.value}</p>
              <p className="mt-1 text-sm text-zinc-600">{stat.label}</p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
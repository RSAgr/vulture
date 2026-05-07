import { BarChart3, Compass, Sparkles, Zap } from "lucide-react";
import Container from "@/components/common/Container";

const featureCards = [
  {
    icon: Compass,
    title: "Instant Positioning Audit",
    description:
      "Detects mismatched messaging, weak headlines, and trust gaps before your visitors bounce.",
  },
  {
    icon: BarChart3,
    title: "Evidence-Led Priorities",
    description: "Ranks fixes by expected conversion impact so your team knows what to ship first.",
  },
  {
    icon: Sparkles,
    title: "Rewrite Suggestions",
    description: "Generates on-brand copy alternatives for hero text, CTAs, and social proof blocks.",
  },
];

const steps = [
  "Submit your product or landing page URL.",
  "Vulture scores clarity, credibility, and friction in seconds.",
  "You receive a report with prioritized fixes and rewritten copy options.",
];

export default function Features() {
  return (
    <>
      <section id="features" className="py-10 sm:py-14">
        <Container>
          <div className="mb-7 reveal">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">Core Features</p>
            <h2 className="mt-2 text-3xl font-black text-zinc-950 sm:text-4xl">Built for speed, clarity, and lift</h2>
          </div>

          <div className="grid gap-5 md:grid-cols-3 reveal reveal-delay-1">
            {featureCards.map(({ icon: Icon, title, description }) => (
              <article
                key={title}
                className="rounded-3xl border border-zinc-900/10 bg-white p-6 shadow-[0_15px_45px_-32px_rgba(0,0,0,0.5)]"
              >
                <div className="mb-4 inline-flex rounded-xl bg-(--color-hero-accent)/15 p-2.5 text-(--color-hero-accent)">
                  <Icon className="size-5" />
                </div>
                <h3 className="text-lg font-bold text-zinc-900">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-600">{description}</p>
              </article>
            ))}
          </div>
        </Container>
      </section>

      <section id="process" className="py-8 sm:py-12">
        <Container>
          <div className="rounded-3xl border border-zinc-900/10 bg-zinc-950 px-6 py-8 text-zinc-100 sm:px-10 sm:py-10 reveal reveal-delay-2">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-zinc-400">
              <Zap className="size-4 text-(--color-hero-accent)" />
              How It Works
            </div>
            <h3 className="mt-3 text-2xl font-black sm:text-3xl">From URL to action plan in three steps</h3>
            <ol className="mt-6 grid gap-4 sm:grid-cols-3">
              {steps.map((step, index) => (
                <li key={step} className="rounded-2xl border border-white/12 bg-white/5 p-4 text-sm leading-relaxed">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-[0.15em] text-zinc-400">
                    Step {index + 1}
                  </p>
                  <p>{step}</p>
                </li>
              ))}
            </ol>
          </div>
        </Container>
      </section>
    </>
  );
}
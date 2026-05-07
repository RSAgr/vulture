import Container from "@/components/common/Container";
import Navbar from "@/components/common/Navbar";
import Footer from "@/components/common/Footer";
import CreditAuditForm from "@/components/form/CreditAuditForm";

export default function CheckCreditsPage() {
  return (
    <>
      <Navbar />
      <main className="py-12 sm:py-16">
        <Container>
          <div className="mb-8 max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">Step 1: Submit Details</p>
            <h1 className="mt-2 text-4xl font-black text-zinc-950">Know if your company is overspending on credits</h1>
            <p className="mt-3 text-zinc-600">
              Enter your company usage data to generate an immediate overspending estimate and savings opportunity.
            </p>
          </div>
          <CreditAuditForm />
        </Container>
      </main>
      <Footer />
    </>
  );
}
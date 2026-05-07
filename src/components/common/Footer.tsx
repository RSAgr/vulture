import Container from "@/components/common/Container";

export default function Footer() {
	return (
		<footer className="mt-20 border-t border-zinc-900/10 py-10">
			<Container className="flex flex-col gap-5 text-sm text-zinc-600 md:flex-row md:items-center md:justify-between">
				<div>
					<p className="font-semibold text-zinc-800">Vulture</p>
					<p>Product-page audit assistant for conversion-focused teams.</p>
				</div>

				<div className="flex items-center gap-4">
					<a href="#features" className="hover:text-zinc-900">
						Features
					</a>
					<a href="#process" className="hover:text-zinc-900">
						Process
					</a>
					<a href="#cta" className="hover:text-zinc-900">
						Contact
					</a>
				</div>
			</Container>
		</footer>
	);
}

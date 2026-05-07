import Link from "next/link";
import { Button } from "@/components/ui/button";
import Container from "@/components/common/Container";

const links = [
	{ label: "Why Vulture", href: "#features" },
	{ label: "How It Works", href: "#process" },
	{ label: "Proof", href: "#proof" },
	{ label: "Company Check", href: "/check-credits" },
];

export default function Navbar() {
	return (
		<header className="sticky top-0 z-40 border-b border-white/30 bg-white/70 backdrop-blur-md">
			<Container className="flex h-16 items-center justify-between">
				<Link href="/" className="text-xl font-bold tracking-tight text-zinc-900">
					Vulture
				</Link>

				<nav className="hidden items-center gap-6 md:flex">
					{links.map((link) => (
						<a
							key={link.href}
							href={link.href}
							className="text-sm font-semibold text-zinc-700 transition-colors hover:text-zinc-900"
						>
							{link.label}
						</a>
					))}
				</nav>

				<Button
					asChild
					size="sm"
					className="bg-zinc-900 text-white shadow-lg shadow-zinc-900/20 hover:bg-zinc-700"
				>
					<a href="#cta">Get Free Audit</a>
				</Button>
			</Container>
		</header>
	);
}

import Link from "next/link";
import { navigation, siteConfig } from "@/shared/config/site";
import { Container } from "@/shared/ui/container";

export function Header() {
  return (
    <header className="absolute inset-x-0 top-0 z-30">
      <Container className="flex flex-wrap items-center justify-between gap-x-10 gap-y-4 py-6">
        <Link href="/" className="font-serif text-2xl tracking-wide md:text-3xl">
          {siteConfig.name}
        </Link>
        <nav aria-label="Primary" className="order-3 flex w-full gap-7 overflow-x-auto text-[11px] uppercase tracking-[0.22em] text-muted md:order-none md:w-auto">
          {navigation.map((item) => (
            <Link key={item.href} href={item.href} className="whitespace-nowrap transition-colors hover:text-accent">
              {item.label}
            </Link>
          ))}
        </nav>
        <form action="/search" role="search" className="flex items-center border-b border-line focus-within:border-accent">
          <input
            type="search"
            name="q"
            required
            placeholder="Search films"
            aria-label="Search films"
            className="w-36 bg-transparent py-1.5 text-sm outline-none placeholder:text-muted md:w-48"
          />
          <button type="submit" className="pl-2 text-xs uppercase tracking-[0.2em] text-muted hover:text-accent">
            Go
          </button>
        </form>
      </Container>
    </header>
  );
}

import { Suspense } from "react";
import Link from "next/link";
import { categoryMeta } from "@/modules/movies/categories";
import { SearchBox } from "@/modules/movies/components/search-box";
import { getFeaturedGenres, providerInfo } from "@/modules/movies/services/movie-service";
import { siteConfig } from "@/shared/config/site";
import { Container } from "@/shared/ui/container";
import { MobileNav } from "./mobile-nav";

type NavLink = { href: string; label: string };

async function NavLinks({ className }: { className?: string }) {
  const links = await buildLinks();
  return (
    <nav aria-label="Primary" className={className}>
      {links.map((item) => (
        <Link key={item.href} href={item.href} className="whitespace-nowrap transition-colors hover:text-primary">
          {item.label}
        </Link>
      ))}
    </nav>
  );
}

async function buildLinks(): Promise<NavLink[]> {
  const featured = await getFeaturedGenres();
  return [
    { href: "/", label: "Movies" },
    ...featured.map((g) => ({ href: `/genre/${g.slug}`, label: g.name.startsWith("Cartoon") ? "Cartoon" : g.name })),
    { href: "/genres", label: "All genres" },
    ...providerInfo.categories
      .filter((c) => c === "top-rated" || c === "upcoming")
      .map((c) => ({ href: `/movies/${c}`, label: categoryMeta[c].nav })),
  ];
}

async function MobileMenu() {
  return <MobileNav links={await buildLinks()} />;
}

export function Header() {
  return (
    <header className="absolute inset-x-0 top-0 z-30">
      <Container className="flex items-center justify-between gap-6 py-6">
        <Link href="/" className="font-serif text-2xl tracking-wide md:text-3xl">
          {siteConfig.name}
        </Link>
        <Suspense fallback={<div className="hidden flex-1 md:block" />}>
          <NavLinks className="hidden gap-7 text-[11px] uppercase tracking-[0.2em] text-muted-foreground md:flex" />
        </Suspense>
        <div className="flex items-center gap-3">
          <SearchBox variant="header" />
          <Suspense fallback={null}>
            <MobileMenu />
          </Suspense>
        </div>
      </Container>
    </header>
  );
}

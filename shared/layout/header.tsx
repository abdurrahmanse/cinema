import Link from "next/link";
import { SearchIcon } from "lucide-react";
import { categoryMeta } from "@/modules/movies/categories";
import { providerInfo } from "@/modules/movies/services/movie-service";
import { siteConfig } from "@/shared/config/site";
import { Container } from "@/shared/ui/container";
import { MobileNav } from "./mobile-nav";

export function Header() {
  const links = providerInfo.categories
    .filter((c) => c !== "trending")
    .map((c) => ({ href: `/movies/${c}`, label: categoryMeta[c].nav }));

  return (
    <header className="absolute inset-x-0 top-0 z-30">
      <Container className="flex items-center justify-between gap-6 py-6">
        <Link href="/" className="font-serif text-2xl tracking-wide md:text-3xl">
          {siteConfig.name}
        </Link>
        <nav aria-label="Primary" className="hidden gap-8 text-[11px] uppercase tracking-[0.22em] text-muted-foreground md:flex">
          {links.map((item) => (
            <Link key={item.href} href={item.href} className="whitespace-nowrap transition-colors hover:text-primary">
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <form action="/search" role="search" className="flex items-center border-b border-border focus-within:border-primary">
            <SearchIcon className="size-4 text-muted-foreground" aria-hidden />
            <input
              type="search"
              name="q"
              required
              placeholder="Search films"
              aria-label="Search films"
              className="w-28 bg-transparent px-2 py-1.5 text-sm outline-none placeholder:text-muted-foreground sm:w-44"
            />
          </form>
          <MobileNav links={links} />
        </div>
      </Container>
    </header>
  );
}

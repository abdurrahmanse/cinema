import Link from "next/link";
import { sectionHref, sectionList } from "@/modules/movies/sections";
import { SearchBox } from "@/modules/movies/components/search-box";
import { siteConfig } from "@/shared/config/site";
import { Container } from "@/shared/ui/container";
import { MobileNav } from "./mobile-nav";

const links = sectionList.map((s) => ({ href: sectionHref(s.id, "latest"), label: s.nav }));

export function Header() {
  return (
    <header className="absolute inset-x-0 top-0 z-30">
      <Container className="flex items-center justify-between gap-6 py-6">
        <Link href="/" className="font-serif text-2xl tracking-wide md:text-3xl">
          {siteConfig.name}
        </Link>
        <nav aria-label="Primary" className="hidden gap-9 text-xs uppercase tracking-[0.22em] text-muted-foreground md:flex">
          {links.map((item) => (
            <Link key={item.href} href={item.href} className="whitespace-nowrap transition-colors hover:text-primary">
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <SearchBox variant="header" />
          <MobileNav links={links} />
        </div>
      </Container>
    </header>
  );
}

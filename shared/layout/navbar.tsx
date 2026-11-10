"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bookmark, Clapperboard, Film, House, Menu, Popcorn, Tv, X } from "lucide-react";
import { SearchBox } from "@/modules/movies/components/search-box";
import { cn } from "@/shared/lib/utils";
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from "@/shared/ui/sheet";

export type NavLink = { href: string; label: string; icon: string };

const ICONS = { home: House, movies: Film, indian: Popcorn, serials: Tv, cartoons: Clapperboard, drama: Film, list: Bookmark } as const;

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}

export function Logo({ name }: { name: string }) {
  return (
    <Link href="/" className="flex items-center gap-2.5" aria-label={`${name} home`}>
      <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-white shadow-lg shadow-primary/40">
        <svg viewBox="0 0 24 24" className="size-4 translate-x-px fill-current" aria-hidden>
          <path d="M8 5v14l11-7z" />
        </svg>
      </span>
      <span className="font-display text-xl font-extrabold tracking-tight md:text-2xl">{name}</span>
    </Link>
  );
}

export function Navbar({ name, links }: { name: string; links: NavLink[] }) {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <header
        className={cn(
          "fixed inset-x-0 top-0 z-40 transition-all duration-300",
          scrolled ? "border-b border-border bg-background/85 backdrop-blur-xl" : "bg-gradient-to-b from-black/80 via-black/30 to-transparent",
        )}
      >
        <div className="flex h-16 items-center gap-8 px-4 md:h-[72px] md:px-10">
          <Logo name={name} />
          <nav aria-label="Primary" className="hidden items-center gap-1 lg:flex">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                aria-current={isActive(pathname, l.href) ? "page" : undefined}
                className={cn(
                  "rounded-md px-3 py-2 text-sm font-medium transition-colors hover:text-white",
                  isActive(pathname, l.href) ? "text-white" : "text-white/65",
                )}
              >
                {l.label}
              </Link>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <SearchBox variant="header" />
            <Sheet>
              <SheetTrigger asChild>
                <button aria-label="Open menu" className="flex size-10 items-center justify-center rounded-full text-white/80 transition-colors hover:bg-white/10 lg:hidden">
                  <Menu className="size-5" />
                </button>
              </SheetTrigger>
              <SheetContent>
                <SheetTitle className="font-display text-2xl font-extrabold">{name}</SheetTitle>
                <SheetDescription className="sr-only">Site navigation</SheetDescription>
                <nav className="mt-2 flex flex-col">
                  {links.map((l) => {
                    const Icon = ICONS[l.icon as keyof typeof ICONS] ?? Film;
                    return (
                      <SheetClose asChild key={l.href}>
                        <Link href={l.href} className="flex items-center gap-4 rounded-lg px-3 py-3.5 text-lg font-semibold transition-colors hover:bg-white/5 hover:text-primary">
                          <Icon className="size-5 text-muted-foreground" /> {l.label}
                        </Link>
                      </SheetClose>
                    );
                  })}
                </nav>
                <SheetClose className="sr-only"><X /></SheetClose>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      {/* Mobile bottom tab bar */}
      <nav
        aria-label="Quick navigation"
        className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-border bg-background/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden"
      >
        {links.filter((l) => ["home", "movies", "indian", "serials", "list"].includes(l.icon)).map((l) => {
          const Icon = ICONS[l.icon as keyof typeof ICONS] ?? Film;
          const active = isActive(pathname, l.href);
          return (
            <Link
              key={l.href}
              href={l.href}
              aria-current={active ? "page" : undefined}
              className={cn("flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition-colors", active ? "text-primary" : "text-muted-foreground")}
            >
              <Icon className="size-5" />
              {l.label}
            </Link>
          );
        })}
      </nav>
    </>
  );
}

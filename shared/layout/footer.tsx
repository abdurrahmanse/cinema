import Link from "next/link";
import { sectionList } from "@/modules/movies/sections";
import { providerInfo } from "@/modules/movies/services/movie-service";
import { siteConfig } from "@/shared/config/site";
import { Logo } from "./navbar";

const columns = [
  {
    title: "Browse",
    links: [...sectionList.map((s) => ({ href: `/${s.id}`, label: s.title })), { href: "/my-list", label: "My List" }],
  },
  {
    title: "Company",
    links: [
      { href: "/about", label: "About" },
      { href: "/terms", label: "Terms of Use" },
      { href: "/privacy", label: "Privacy" },
      { href: "/copyright", label: "Copyright & Takedowns" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="mt-16 border-t border-border bg-card/40 px-4 pb-28 pt-14 md:px-10 lg:pb-14">
      <div className="mx-auto grid max-w-7xl gap-10 md:grid-cols-[1.6fr_1fr_1fr]">
        <div>
          <Logo name={siteConfig.name} />
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted-foreground">{siteConfig.tagline}</p>
        </div>
        {columns.map((col) => (
          <nav key={col.title} aria-label={col.title}>
            <p className="mb-4 text-sm font-semibold">{col.title}</p>
            <ul className="space-y-2.5 text-sm text-muted-foreground">
              {col.links.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="transition-colors hover:text-primary">{l.label}</Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <div className="mx-auto mt-12 flex max-w-7xl flex-col justify-between gap-2 border-t border-border pt-6 text-xs text-muted-foreground md:flex-row">
        <p>{providerInfo.attribution}</p>
        <p>No video files are hosted on this site.</p>
      </div>
    </footer>
  );
}

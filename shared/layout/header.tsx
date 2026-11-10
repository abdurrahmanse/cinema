import { Suspense } from "react";
import { sectionList } from "@/modules/movies/sections";
import { siteConfig } from "@/shared/config/site";
import { Navbar, type NavLink } from "./navbar";

const links: NavLink[] = [
  { href: "/", label: "Home", icon: "home" },
  ...sectionList.map((s) => ({ href: `/${s.id}`, label: s.nav, icon: s.id })),
  { href: "/my-list", label: "My List", icon: "list" },
];

export function Header() {
  return (
    <Suspense fallback={<div className="fixed inset-x-0 top-0 z-40 h-16 bg-gradient-to-b from-black/80 to-transparent md:h-[72px]" />}>
      <Navbar name={siteConfig.name} links={links} />
    </Suspense>
  );
}

import Link from "next/link";
import { ChevronRight } from "lucide-react";

export function SectionHeading({ title, eyebrow, href, linkLabel = "See all" }: { title: string; eyebrow?: string; href?: string; linkLabel?: string }) {
  return (
    <div className="mb-5 flex items-end justify-between gap-6">
      <div>
        {eyebrow && <p className="mb-1 text-sm font-semibold text-primary">{eyebrow}</p>}
        <h2 className="font-display text-2xl font-bold">{title}</h2>
      </div>
      {href && (
        <Link href={href} className="flex shrink-0 items-center text-sm font-medium text-muted-foreground transition-colors hover:text-primary">
          {linkLabel} <ChevronRight className="size-4" />
        </Link>
      )}
    </div>
  );
}

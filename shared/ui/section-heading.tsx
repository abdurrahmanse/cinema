import Link from "next/link";

export function SectionHeading({
  title,
  eyebrow,
  href,
  linkLabel = "View all",
}: {
  title: string;
  eyebrow?: string;
  href?: string;
  linkLabel?: string;
}) {
  return (
    <div className="mb-8 flex items-end justify-between gap-6 border-b border-line pb-4">
      <div>
        {eyebrow && <p className="mb-2 text-[11px] uppercase tracking-[0.28em] text-accent">{eyebrow}</p>}
        <h2 className="font-serif text-3xl md:text-4xl">{title}</h2>
      </div>
      {href && (
        <Link
          href={href}
          className="shrink-0 text-xs uppercase tracking-[0.2em] text-muted transition-colors hover:text-accent"
        >
          {linkLabel} →
        </Link>
      )}
    </div>
  );
}

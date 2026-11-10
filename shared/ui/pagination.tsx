import Link from "next/link";

export function Pagination({
  page,
  totalPages,
  hrefFor,
}: {
  page: number;
  totalPages: number;
  hrefFor: (page: number) => string;
}) {
  if (totalPages <= 1) return null;
  const linkClass =
    "border border-line px-5 py-2.5 text-xs uppercase tracking-[0.2em] transition-colors hover:border-accent hover:text-accent";
  return (
    <nav aria-label="Pagination" className="mt-16 flex items-center justify-between">
      {page > 1 ? (
        <Link href={hrefFor(page - 1)} className={linkClass}>← Previous</Link>
      ) : <span />}
      <span className="font-serif text-lg text-muted">
        {page} <span className="text-line">/</span> {totalPages}
      </span>
      {page < totalPages ? (
        <Link href={hrefFor(page + 1)} className={linkClass}>Next →</Link>
      ) : <span />}
    </nav>
  );
}

import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/shared/ui/button";

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
  return (
    <nav aria-label="Pagination" className="mt-16 flex items-center justify-between">
      {page > 1 ? (
        <Button asChild variant="subtle">
          <Link href={hrefFor(page - 1)}><ArrowLeft /> Previous</Link>
        </Button>
      ) : <span />}
      <span className="font-serif text-lg text-muted-foreground">
        {page} <span className="text-border">/</span> {totalPages}
      </span>
      {page < totalPages ? (
        <Button asChild variant="subtle">
          <Link href={hrefFor(page + 1)}>Next <ArrowRight /></Link>
        </Button>
      ) : <span />}
    </nav>
  );
}

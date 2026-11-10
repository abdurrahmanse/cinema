import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/shared/ui/button";

export function Pagination({ page, totalPages, hrefFor }: { page: number; totalPages: number; hrefFor: (page: number) => string }) {
  if (totalPages <= 1) return null;
  return (
    <nav aria-label="Pagination" className="mt-14 flex items-center justify-between gap-4">
      {page > 1 ? (
        <Button asChild variant="subtle"><Link href={hrefFor(page - 1)}><ArrowLeft /> Previous</Link></Button>
      ) : <span className="w-28" />}
      <span className="text-sm font-medium text-muted-foreground">
        Page <span className="text-foreground">{page}</span> of {totalPages}
      </span>
      {page < totalPages ? (
        <Button asChild variant="subtle"><Link href={hrefFor(page + 1)}>Next <ArrowRight /></Link></Button>
      ) : <span className="w-28" />}
    </nav>
  );
}

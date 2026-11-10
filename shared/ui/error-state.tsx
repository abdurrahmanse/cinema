import Link from "next/link";
import { TriangleAlert } from "lucide-react";
import { Button } from "@/shared/ui/button";

export function ErrorState({ title = "Something went wrong.", message, retryHref }: { title?: string; message?: string; retryHref?: string }) {
  return (
    <div role="alert" className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-border py-24 text-center">
      <TriangleAlert className="size-9 text-primary" />
      <p className="font-display text-3xl font-bold">{title}</p>
      <p className="max-w-md text-muted-foreground">{message ?? "We couldn’t load this right now. Please try again in a moment."}</p>
      <div className="flex gap-3">
        {retryHref && <Button asChild><Link href={retryHref}>Try again</Link></Button>}
        <Button asChild variant="subtle"><Link href="/">Back home</Link></Button>
      </div>
    </div>
  );
}

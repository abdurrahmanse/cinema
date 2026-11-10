"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/shared/ui/button";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 text-center">
      <p className="mb-3 text-sm font-semibold text-primary">Something went wrong</p>
      <h1 className="font-display text-4xl font-extrabold">The projector jammed.</h1>
      <p className="mt-3 max-w-md text-muted-foreground">We hit a problem loading this page. It’s usually temporary — please try again.</p>
      <div className="mt-8 flex gap-3">
        <Button size="lg" onClick={reset}>Try again</Button>
        <Button asChild size="lg" variant="subtle"><Link href="/">Back home</Link></Button>
      </div>
    </div>
  );
}

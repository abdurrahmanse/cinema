import Link from "next/link";
import { Button } from "@/shared/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 text-center">
      <p className="font-display text-8xl font-extrabold text-primary md:text-9xl">404</p>
      <h1 className="mt-4 font-display text-3xl font-bold md:text-4xl">This reel is missing.</h1>
      <p className="mt-3 max-w-md text-muted-foreground">The page you’re looking for doesn’t exist or has moved.</p>
      <Button asChild size="lg" className="mt-8"><Link href="/">Back to home</Link></Button>
    </div>
  );
}

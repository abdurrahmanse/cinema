import Link from "next/link";
import { Container } from "@/shared/ui/container";

export default function NotFound() {
  return (
    <Container className="py-48 text-center">
      <p className="mb-4 text-[11px] uppercase tracking-[0.3em] text-accent">404</p>
      <h1 className="font-serif text-5xl">This reel is missing.</h1>
      <Link href="/" className="mt-10 inline-block text-xs uppercase tracking-[0.25em] text-muted hover:text-accent">
        ← Back to the lobby
      </Link>
    </Container>
  );
}

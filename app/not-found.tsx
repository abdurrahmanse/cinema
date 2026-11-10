import Link from "next/link";
import { Button } from "@/shared/ui/button";
import { Container } from "@/shared/ui/container";

export default function NotFound() {
  return (
    <Container className="py-48 text-center">
      <p className="mb-4 text-[11px] uppercase tracking-[0.3em] text-primary">404</p>
      <h1 className="font-serif text-5xl">This reel is missing.</h1>
      <Button asChild variant="subtle" className="mt-10">
        <Link href="/">Back to the lobby</Link>
      </Button>
    </Container>
  );
}

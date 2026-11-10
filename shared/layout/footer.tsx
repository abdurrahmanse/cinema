import { providerInfo } from "@/modules/movies/services/movie-service";
import { siteConfig } from "@/shared/config/site";
import { Container } from "@/shared/ui/container";

export function Footer() {
  return (
    <footer className="mt-auto border-t border-border py-12">
      <Container className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
        <p className="font-serif text-xl">{siteConfig.name}</p>
        <p className="text-xs tracking-[0.15em] text-muted-foreground">{siteConfig.tagline}</p>
        <p className="text-xs tracking-[0.15em] text-muted-foreground">{providerInfo.attribution}</p>
      </Container>
    </footer>
  );
}

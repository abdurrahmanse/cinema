import type { Metadata } from "next";
import { providerInfo } from "@/modules/movies/services/movie-service";
import { siteConfig } from "@/shared/config/site";
import { LegalPage } from "@/shared/ui/legal-page";

export const metadata: Metadata = { title: "About" };

export default function AboutPage() {
  return (
    <LegalPage title="About" updated="2026">
      <p>
        {siteConfig.name} is a quiet, classical home for film. {siteConfig.description}
      </p>
      <h2>Where the films come from</h2>
      <p>
        {siteConfig.name} does not host any video files. Catalogue data, posters and trailers are loaded live from public
        film APIs, and playable films are streamed from the servers of the rights-holder or archive that provides them.
      </p>
      <p>{providerInfo.attribution}</p>
      <h2>How it stays current</h2>
      <p>
        Lists of new releases refresh automatically every few minutes — there is nothing to upload and nothing to
        maintain by hand.
      </p>
      <h2>Playback</h2>
      <p>
        When a film is offered from more than one server, the player connects to the next server automatically if one
        fails, and lets you pick a server manually from the player controls.
      </p>
    </LegalPage>
  );
}

import type { Metadata } from "next";
import { LegalPage } from "@/shared/ui/legal-page";

export const metadata: Metadata = { title: "Privacy" };

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy" updated="2026">
      <p>This policy is a template — have it reviewed against the privacy laws that apply to you before launch.</p>
      <h2>What we store</h2>
      <p>
        There are no accounts. “My List” and “Continue watching” are stored only in your browser’s local storage on this
        device. We never receive them, and you can clear them at any time from your browser settings.
      </p>
      <h2>Third parties</h2>
      <ul>
        <li>Film data and artwork are requested from the configured film API.</li>
        <li>Trailers play from YouTube (privacy-enhanced mode) when you choose to watch them.</li>
        <li>Videos stream directly from the provider’s servers, which may see your IP address.</li>
      </ul>
    </LegalPage>
  );
}

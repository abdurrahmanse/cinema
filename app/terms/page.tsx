import type { Metadata } from "next";
import { siteConfig } from "@/shared/config/site";
import { LegalPage } from "@/shared/ui/legal-page";

export const metadata: Metadata = { title: "Terms of Use" };

export default function TermsPage() {
  return (
    <LegalPage title="Terms of Use" updated="2026">
      <p>
        These terms are a template — have them reviewed against the laws that apply to your business before launch.
      </p>
      <h2>Using {siteConfig.name}</h2>
      <p>
        You may browse and watch content for personal, non-commercial use. You agree not to scrape, resell, or attempt
        to disrupt the service.
      </p>
      <h2>Third-party content</h2>
      <p>
        Films, trailers and images are provided by third parties and remain the property of their respective owners.
        Availability can change at any time without notice.
      </p>
      <h2>No warranty</h2>
      <p>The service is provided “as is”, without warranties of any kind.</p>
    </LegalPage>
  );
}

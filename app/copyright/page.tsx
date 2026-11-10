import type { Metadata } from "next";
import { contactEmail, LegalPage } from "@/shared/ui/legal-page";

export const metadata: Metadata = { title: "Copyright & Takedowns" };

export default function CopyrightPage() {
  return (
    <LegalPage title="Copyright & Takedowns" updated="2026">
      <p>
        We respect intellectual property. This site does not host video files; it links to content served by third
        parties.
      </p>
      <h2>Report an issue</h2>
      <p>
        If you believe a title is available without authorisation, email <a href={`mailto:${contactEmail}`}>{contactEmail}</a>{" "}
        with the page URL, the work concerned, and your contact details. Valid requests are acted on promptly.
      </p>
    </LegalPage>
  );
}

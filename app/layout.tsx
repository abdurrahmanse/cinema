import type { Metadata, Viewport } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import { siteConfig, siteUrl } from "@/shared/config/site";
import { Toaster } from "sonner";
import { Footer } from "@/shared/layout/footer";
import { Header } from "@/shared/layout/header";
import "./globals.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });
const jakarta = Plus_Jakarta_Sans({ variable: "--font-jakarta", subsets: ["latin"], weight: ["500", "600", "700", "800"] });

export const viewport: Viewport = { themeColor: "#09090d", colorScheme: "dark" };

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: `${siteConfig.name} — ${siteConfig.tagline}`, template: `%s · ${siteConfig.name}` },
  description: siteConfig.description,
  openGraph: { type: "website", siteName: siteConfig.name, title: siteConfig.name, description: siteConfig.description },
  twitter: { card: "summary_large_image", title: siteConfig.name, description: siteConfig.description },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${inter.variable} ${jakarta.variable} h-full antialiased`}>
      <body className="relative flex min-h-full flex-col">
        <a
          href="#main"
          className="sr-only z-50 bg-primary px-4 py-2 text-xs uppercase tracking-[0.2em] text-primary-foreground focus:not-sr-only focus:absolute focus:left-4 focus:top-4"
        >
          Skip to content
        </a>
        <Header />
        <main id="main" className="flex-1">{children}</main>
        <Footer />
        <Toaster theme="dark" position="bottom-center" offset={84} />
      </body>
    </html>
  );
}

export const siteConfig = {
  name: "Cinéma",
  tagline: "The finest in film, always current.",
  description: "A quiet, classical home for films — search, filter by genre and watch. Updated automatically.",
} as const;

export const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");

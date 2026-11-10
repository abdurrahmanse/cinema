# Cinéma

A minimal, classical movie website. No backend, no uploads — films come from a movie API and new releases appear automatically.

## Setup

```bash
cp .env.example .env.local   # then set MOVIE_API_TOKEN
npm install
npm run dev
```

Without `MOVIE_API_TOKEN` the site runs on built-in demo data (a banner tells you so).
Default provider: [TMDB](https://www.themoviedb.org/) v3 (use the *API Read Access Token*).

## Structure (modular monolith)

```
app/                    routing only (thin pages)
modules/movies/
  api/                  providers: tmdb.ts, mock.ts  (swap the API here only)
  services/             cached data access ('use cache' + cacheLife)
  components/           hero, card, grid, detail …
  types.ts, categories.ts, image.ts
shared/
  ui/ layout/ lib/ config/   design-system primitives, header/footer, formatters, site config
```

To use a different API, implement the `MovieProvider` interface (`modules/movies/types.ts`) and select it in `services/movie-service.ts`.

## Freshness

Lists are cached for ~1 hour (`cacheLife("hours")`), so new releases show up on their own. Call `revalidateTag("movies")` to force a refresh.

## Design system

Minimalism × classicism: Cormorant Garamond (serif) + Inter, warm ink background, ivory text, a single muted-gold accent, hairline borders, generous whitespace. Tokens live in `app/globals.css`.

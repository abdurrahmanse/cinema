# Cinéma

A premium streaming-style site (Netflix / Prime Video class): billboard hero, rails, Top 10, filters, search, My List, Continue watching, and a failover video player. No backend — everything comes from a movie API.

## Run
```bash
npm install
cp .env.example .env.local   # then add your token
npm run dev
```

## Data sources (auto-selected)
| Mode | Setup | You get |
|---|---|---|
| **TMDB** (recommended) | `MOVIE_API_TOKEN` in `.env.local` | Newest releases, upcoming, trending, Indian cinema by language, series, genres, cast, trailers |
| **Internet Archive** (default) | none | Keyless demo: public-domain films, series and cartoons that play in full |

### Getting a TMDB token
1. Sign up at themoviedb.org → Settings → API → *Request an API key*.
2. Copy the **API Read Access Token** (long, starts with `eyJ…`) — not the short v3 key.
3. Put it in `.env.local` as `MOVIE_API_TOKEN=…` and restart.

TMDB provides metadata, images and trailers — **not full movies**. Full playback comes from servers you are licensed to stream from:
`MOVIE_STREAM_URL_TEMPLATE=https://cdn1.example.com/{id}/master.m3u8,https://cdn2.example.com/{id}.mp4`
Servers are tried in order; the player fails over automatically and falls back to the trailer.

## Structure (modular monolith)
```
app/                      routing only
modules/movies/           api/ (tmdb, archive, http), services/ (cached), components/, rails.ts, sections.ts, filters.ts
modules/library/          My List + Continue watching (localStorage)
shared/                   ui/ (shadcn/ui + Radix), layout/, lib/, config/
```
Add shadcn components with `npx shadcn@latest add <name>` (configured in `components.json`).

## Design system
shadcn/ui + Radix tokens in `app/globals.css`. Plus Jakarta Sans (display) + Inter (UI), near-black surfaces, rose primary, amber ratings, rounded cards.

## Freshness
New-release lists cache for minutes (`cacheLife("minutes")`), pages auto-refresh every 5 min.

## Before launch
Set `NEXT_PUBLIC_SITE_URL` and `NEXT_PUBLIC_CONTACT_EMAIL`, and have the Terms/Privacy templates reviewed.

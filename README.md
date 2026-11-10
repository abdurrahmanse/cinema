# Cinéma

A minimal, classical movie website. No backend, no uploads — the catalogue comes from a movie API, so new releases appear on their own.

## Features
- Home with featured film and rails (latest, upcoming, top rated, popular)
- **Genre filter** and pagination on every collection (`/movies/[category]?genre=…`)
- **Search** by title
- Film page: details, cast, similar films, and a **custom video player** (play/pause, seek, ±10s, volume, fullscreen, keyboard: Space/K, ←/→, M, F; MP4 and HLS)

## Data sources (auto-selected)
| Mode | Setup | You get |
|---|---|---|
| **Internet Archive** (default) | none — keyless | Real API, full-length public-domain films that play in full |
| **TMDB** | `MOVIE_API_TOKEN` in `.env.local` | Newest releases, upcoming, genres, cast, official trailers in the player |

TMDB provides metadata and trailers, not full films. To play full films in TMDB mode you must supply a source you are licensed to stream:
`MOVIE_STREAM_URL_TEMPLATE=https://cdn.example.com/films/{id}/master.m3u8`

```bash
cp .env.example .env.local
npm install
npm run dev
```

## Structure (modular monolith)
```
app/                    routing only
modules/movies/
  api/                  providers: tmdb.ts, archive.ts  (swap or add APIs here)
  services/             cached data access ('use cache' + cacheLife)
  components/           hero, card, grid, genre filter, video player, detail
shared/
  ui/                   shadcn/ui components on Radix primitives (Button, Badge, Slider, Tooltip, Sheet, Avatar…)
  layout/ lib/ config/
```
New API? Implement `MovieProvider` (`modules/movies/types.ts`) and select it in `services/movie-service.ts`.

## Design system
**shadcn/ui + Radix UI**, themed with semantic CSS variables in `app/globals.css`. Classicism × minimalism: Cormorant Garamond + Inter, warm ink background, ivory text, one muted-gold `primary`, square corners, hairline borders.

Lists are cached ~1 hour; `revalidateTag("movies")` forces a refresh.

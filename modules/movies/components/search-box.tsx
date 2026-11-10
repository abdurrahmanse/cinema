"use client";

import { useEffect, useId, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Loader2, SearchIcon, Star, X } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { imageUrl, isOptimizable } from "../image";
import type { SearchSuggestion } from "@/app/api/search/route";

type Variant = "hero" | "header";

export function SearchBox({ variant = "header", autoFocus = false }: { variant?: Variant; autoFocus?: boolean }) {
  const router = useRouter();
  const listId = useId();
  const wrapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const header = variant === "header";
  const [expanded, setExpanded] = useState(!header);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<{ q: string; results: SearchSuggestion[] }>({ q: "", results: [] });

  const trimmed = query.trim();
  const results = data.q === trimmed ? data.results : [];
  const showPanel = open && trimmed.length >= 2;

  // Debounced live suggestions
  useEffect(() => {
    if (trimmed.length < 2) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(trimmed)}`, { signal: controller.signal });
        const json = (await res.json()) as { q: string; results: SearchSuggestion[] };
        setData({ q: trimmed, results: json.results });
      } catch {
        /* aborted or offline */
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 250);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [trimmed]);

  // Close on outside click; collapse the header box when empty
  useEffect(() => {
    const onDown = (e: PointerEvent) => {
      if (wrapRef.current?.contains(e.target as Node)) return;
      setOpen(false);
      if (header) setExpanded((x) => (inputRef.current?.value ? x : false));
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [header]);

  // "/" or Ctrl/Cmd+K focuses search from anywhere
  useEffect(() => {
    if (!header) return;
    const onKey = (e: KeyboardEvent) => {
      const typing = /input|textarea|select/i.test((e.target as HTMLElement).tagName);
      if ((e.key === "/" && !typing) || ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k")) {
        e.preventDefault();
        setExpanded(true);
        setTimeout(() => inputRef.current?.focus(), 0);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [header]);

  const goSearch = () => {
    if (!trimmed) return;
    setOpen(false);
    router.push(`/search?q=${encodeURIComponent(trimmed)}`);
  };

  const goMovie = (kind: string, id: string) => {
    setOpen(false);
    setQuery("");
    router.push(`/${kind}/${encodeURIComponent(id)}`);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setActive((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, -1));
    } else if (e.key === "Escape") {
      setOpen(false);
      if (header && !query) setExpanded(false);
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (active >= 0 && results[active]) goMovie(results[active].kind, results[active].id);
      else goSearch();
    }
  };

  return (
    <div ref={wrapRef} className={cn("relative", header ? "" : "w-full max-w-2xl")}>
      <div
        className={cn(
          "flex items-center transition-all duration-300",
          header
            ? cn("h-10 rounded-full", expanded ? "w-44 border border-white/25 bg-black/60 pl-3 backdrop-blur-md sm:w-64" : "w-10 justify-center")
            : "h-14 gap-3 rounded-full border border-input bg-white/[0.05] px-5 focus-within:border-primary",
        )}
      >
        <button
          type="button"
          aria-label="Search"
          onClick={() => {
            if (header && !expanded) {
              setExpanded(true);
              setTimeout(() => inputRef.current?.focus(), 0);
            } else goSearch();
          }}
          className={cn("shrink-0 text-white/85 transition-colors hover:text-primary", header && !expanded && "flex size-10 items-center justify-center rounded-full hover:bg-white/10")}
        >
          <SearchIcon className={header ? "size-5" : "size-5 text-muted-foreground"} />
        </button>
        <input
          ref={inputRef}
          type="search"
          role="combobox"
          aria-expanded={showPanel}
          aria-controls={listId}
          aria-activedescendant={active >= 0 ? `${listId}-${active}` : undefined}
          aria-autocomplete="list"
          autoComplete="off"
          autoFocus={autoFocus}
          tabIndex={expanded ? 0 : -1}
          value={query}
          placeholder="Titles, genres, people"
          aria-label="Search films"
          onChange={(e) => {
            setQuery(e.target.value);
            setActive(-1);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          className={cn(
            "min-w-0 bg-transparent text-sm outline-none placeholder:text-muted-foreground [&::-webkit-search-cancel-button]:appearance-none",
            header ? (expanded ? "w-full px-2" : "w-0") : "w-full text-base md:text-lg",
          )}
        />
        {loading && <Loader2 className="mr-3 size-4 shrink-0 animate-spin text-primary" aria-label="Searching" />}
        {header && expanded && query && !loading && (
          <button type="button" aria-label="Clear search" onClick={() => { setQuery(""); inputRef.current?.focus(); }} className="mr-3 text-white/60 hover:text-white">
            <X className="size-4" />
          </button>
        )}
      </div>

      {showPanel && (
        <ul
          id={listId}
          role="listbox"
          className={cn(
            "absolute z-50 mt-3 max-h-[70vh] overflow-y-auto rounded-xl border border-white/10 bg-popover/95 p-1.5 shadow-2xl shadow-black/70 backdrop-blur-xl",
            header ? "right-0 w-[min(24rem,calc(100vw-2rem))]" : "inset-x-0",
          )}
        >
          {results.length === 0 && !loading && (
            <li className="px-4 py-8 text-center text-sm text-muted-foreground">No titles match “{trimmed}”.</li>
          )}
          {results.map((m, i) => {
            const src = imageUrl(m.posterPath, "w185");
            return (
              <li
                key={`${m.kind}:${m.id}`}
                id={`${listId}-${i}`}
                role="option"
                aria-selected={i === active}
                onMouseEnter={() => setActive(i)}
                onClick={() => goMovie(m.kind, m.id)}
                className={cn("flex cursor-pointer items-center gap-4 rounded-lg px-2.5 py-2", i === active && "bg-white/10")}
              >
                <span className="relative h-16 w-11 shrink-0 overflow-hidden rounded-md bg-card ring-1 ring-white/10">
                  {src && <Image src={src} alt="" fill sizes="44px" unoptimized={!isOptimizable(src)} className="object-cover" />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold">{m.title}</span>
                  <span className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                    {m.year ?? "—"} · {m.kind === "tv" ? "Series" : "Movie"}
                    {m.rating > 0 && (
                      <span className="flex items-center gap-0.5 text-rating">
                        <Star className="size-3 fill-current" /> {m.rating.toFixed(1)}
                      </span>
                    )}
                  </span>
                </span>
              </li>
            );
          })}
          {trimmed && (
            <li
              role="option"
              aria-selected={false}
              onClick={goSearch}
              className="mt-1 cursor-pointer rounded-lg border-t border-border px-4 py-3 text-center text-sm font-semibold text-primary transition-colors hover:bg-white/5"
            >
              See all results for “{trimmed}”
            </li>
          )}
        </ul>
      )}
    </div>
  );
}

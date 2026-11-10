"use client";

import { useEffect, useId, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Loader2, SearchIcon } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { imageUrl, isOptimizable } from "../image";
import type { SearchSuggestion } from "@/app/api/search/route";

type Variant = "hero" | "header";

export function SearchBox({ variant = "header", autoFocus = false }: { variant?: Variant; autoFocus?: boolean }) {
  const router = useRouter();
  const listId = useId();
  const wrapRef = useRef<HTMLDivElement>(null);
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

  // Close when clicking outside
  useEffect(() => {
    const onDown = (e: PointerEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, []);

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
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (active >= 0 && results[active]) goMovie(results[active].kind, results[active].id);
      else goSearch();
    }
  };

  const hero = variant === "hero";

  return (
    <div ref={wrapRef} className={cn("relative", hero ? "w-full max-w-2xl" : "w-40 sm:w-56")}>
      <div
        className={cn(
          "flex items-center border-b transition-colors focus-within:border-primary",
          hero ? "gap-4 border-foreground/30 pb-3" : "gap-2 border-border",
        )}
      >
        <SearchIcon className={cn("shrink-0 text-muted-foreground", hero ? "size-6" : "size-4")} aria-hidden />
        <input
          type="search"
          role="combobox"
          aria-expanded={showPanel}
          aria-controls={listId}
          aria-activedescendant={active >= 0 ? `${listId}-${active}` : undefined}
          aria-autocomplete="list"
          autoComplete="off"
          autoFocus={autoFocus}
          value={query}
          placeholder={hero ? "Search every film by title…" : "Search films"}
          aria-label="Search films"
          onChange={(e) => {
            setQuery(e.target.value);
            setActive(-1);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          className={cn(
            "w-full bg-transparent outline-none placeholder:text-muted-foreground [&::-webkit-search-cancel-button]:appearance-none",
            hero ? "font-serif text-2xl md:text-3xl" : "py-1.5 text-sm",
          )}
        />
        {loading && <Loader2 className="size-4 shrink-0 animate-spin text-primary" aria-label="Searching" />}
      </div>

      {showPanel && (
        <ul
          id={listId}
          role="listbox"
          className={cn(
            "absolute z-50 mt-2 max-h-[28rem] overflow-y-auto border border-white/10 bg-[#121110]/90 p-1 shadow-2xl shadow-black/60 backdrop-blur-xl",
            hero ? "inset-x-0" : "right-0 w-[min(22rem,90vw)]",
          )}
        >
          {results.length === 0 && !loading && (
            <li className="px-4 py-6 text-center font-serif text-lg text-muted-foreground">No films match “{trimmed}”.</li>
          )}
          {results.map((m, i) => {
            const src = imageUrl(m.posterPath, "w185");
            return (
              <li
                key={m.id}
                id={`${listId}-${i}`}
                role="option"
                aria-selected={i === active}
                onMouseEnter={() => setActive(i)}
                onClick={() => goMovie(m.kind, m.id)}
                className={cn("flex cursor-pointer items-center gap-4 px-3 py-2.5", i === active && "bg-white/10")}
              >
                <span className="relative h-14 w-10 shrink-0 overflow-hidden bg-card ring-1 ring-border">
                  {src && <Image src={src} alt="" fill sizes="40px" unoptimized={!isOptimizable(src)} className="object-cover" />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-serif text-lg leading-snug">{m.title}</span>
                  <span className="block text-xs tracking-[0.15em] text-muted-foreground">
                    {m.year ?? "—"}
                    {m.rating > 0 && <span className="text-primary"> · ★ {m.rating.toFixed(1)}</span>}
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
              className="cursor-pointer border-t border-border px-4 py-3 text-center text-[11px] uppercase tracking-[0.22em] text-primary transition-colors hover:bg-white/10"
            >
              See all results for “{trimmed}” →
            </li>
          )}
        </ul>
      )}
    </div>
  );
}

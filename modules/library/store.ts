"use client";

import { useSyncExternalStore } from "react";
import type { ItemKind } from "@/modules/movies/types";

/** A film/series the user saved or watched. Only what's needed to render a card. */
export type SavedItem = {
  id: string;
  kind: ItemKind;
  title: string;
  posterPath: string | null;
  releaseDate: string | null;
  rating: number;
};

export type HistoryItem = SavedItem & { position: number; duration: number; updatedAt: number };

const LIST_KEY = "cinema:list";
const HISTORY_KEY = "cinema:history";
const EVENT = "cinema:storage";
const EMPTY: never[] = [];

function createStore<T>(key: string) {
  let raw: string | null = null;
  let cached: T[] = EMPTY;

  const read = (): T[] => {
    try {
      const next = localStorage.getItem(key);
      if (next !== raw) {
        raw = next;
        cached = next ? (JSON.parse(next) as T[]) : EMPTY;
      }
    } catch {
      cached = EMPTY;
    }
    return cached;
  };

  return {
    subscribe(cb: () => void) {
      const onStorage = (e: StorageEvent) => (!e.key || e.key === key) && cb();
      window.addEventListener("storage", onStorage);
      window.addEventListener(EVENT, cb);
      return () => {
        window.removeEventListener("storage", onStorage);
        window.removeEventListener(EVENT, cb);
      };
    },
    snapshot: read,
    serverSnapshot: () => EMPTY as T[],
    write(items: T[]) {
      try {
        localStorage.setItem(key, JSON.stringify(items));
      } catch {
        /* storage blocked or full */
      }
      window.dispatchEvent(new Event(EVENT));
    },
  };
}

const listStore = createStore<SavedItem & { addedAt: number }>(LIST_KEY);
const historyStore = createStore<HistoryItem>(HISTORY_KEY);

const same = (a: { id: string; kind: ItemKind }, b: { id: string; kind: ItemKind }) => a.id === b.id && a.kind === b.kind;

// ---- My List
export function useMyList() {
  return useSyncExternalStore(listStore.subscribe, listStore.snapshot, listStore.serverSnapshot);
}

export function toggleSaved(item: SavedItem) {
  const list = listStore.snapshot();
  listStore.write(
    list.some((x) => same(x, item))
      ? list.filter((x) => !same(x, item))
      : [{ ...item, addedAt: Date.now() }, ...list],
  );
}

// ---- Continue watching
export function useHistory() {
  return useSyncExternalStore(historyStore.subscribe, historyStore.snapshot, historyStore.serverSnapshot);
}

export function getProgress(item: { id: string; kind: ItemKind }): HistoryItem | undefined {
  return historyStore.snapshot().find((x) => same(x, item));
}

export function saveProgress(item: SavedItem, position: number, duration: number) {
  if (!duration || !Number.isFinite(duration)) return;
  const rest = historyStore.snapshot().filter((x) => !same(x, item));
  // Finished (>95%) entries drop out of "continue watching"
  if (position / duration > 0.95) return historyStore.write(rest);
  historyStore.write([{ ...item, position: Math.floor(position), duration: Math.floor(duration), updatedAt: Date.now() }, ...rest].slice(0, 20));
}

export function clearProgress(item: { id: string; kind: ItemKind }) {
  historyStore.write(historyStore.snapshot().filter((x) => !same(x, item)));
}

"use client";

import { Check, Plus } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/shared/lib/utils";
import { toggleSaved, useMyList, type SavedItem } from "./store";

export function SaveButton({
  item,
  variant = "icon",
  className,
}: {
  item: SavedItem;
  variant?: "icon" | "full";
  className?: string;
}) {
  const list = useMyList();
  const saved = list.some((x) => x.id === item.id && x.kind === item.kind);
  const label = saved ? "Remove from My List" : "Add to My List";
  const Icon = saved ? Check : Plus;

  const onClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleSaved(item);
    toast(saved ? `Removed “${item.title}” from My List` : `Added “${item.title}” to My List`);
  };

  if (variant === "full") {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-pressed={saved}
        className={cn(
          "inline-flex h-12 items-center justify-center gap-2 rounded-md px-7 text-base font-semibold backdrop-blur-md transition-all active:scale-[0.97]",
          saved ? "bg-white/25 text-white hover:bg-white/30" : "bg-white/15 text-white hover:bg-white/25",
          className,
        )}
      >
        <Icon className="size-5" /> {saved ? "In My List" : "My List"}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={saved}
      aria-label={label}
      title={label}
      className={cn(
        "flex size-9 items-center justify-center rounded-full border border-white/30 bg-black/55 text-white backdrop-blur-md transition-all hover:border-white hover:bg-black/75 active:scale-90",
        saved && "border-primary bg-primary text-white hover:bg-primary/90",
        className,
      )}
    >
      <Icon className="size-4" />
    </button>
  );
}

import Image from "next/image";
import { cn } from "@/shared/lib/utils";
import { imageUrl, isOptimizable } from "../image";

export function Poster({
  path,
  title,
  sizes = "(min-width: 1280px) 15vw, (min-width: 1024px) 18vw, (min-width: 640px) 28vw, 45vw",
  priority = false,
  className,
}: {
  path: string | null;
  title: string;
  sizes?: string;
  priority?: boolean;
  className?: string;
}) {
  const src = imageUrl(path, "w500");
  return (
    <div className={cn("relative aspect-[2/3] w-full overflow-hidden rounded-lg bg-card", className)}>
      <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-secondary to-card p-4 text-center">
        <span className="line-clamp-4 font-display text-lg font-bold leading-snug text-foreground/70">{title}</span>
      </div>
      {src && (
        <Image
          src={src}
          alt={`${title} poster`}
          fill
          sizes={sizes}
          priority={priority}
          unoptimized={!isOptimizable(src)}
          className="object-cover"
        />
      )}
    </div>
  );
}

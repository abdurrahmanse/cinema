import Image from "next/image";
import { imageUrl, isOptimizable } from "../image";

export function Poster({
  path,
  title,
  sizes = "(min-width: 1024px) 18vw, (min-width: 640px) 28vw, 45vw",
  priority = false,
}: {
  path: string | null;
  title: string;
  sizes?: string;
  priority?: boolean;
}) {
  const src = imageUrl(path, "w500");
  return (
    <div className="relative aspect-[2/3] w-full overflow-hidden bg-card ring-1 ring-border">
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-6 text-center">
        <span className="h-px w-8 bg-primary" />
        <span className="font-serif text-xl leading-snug text-foreground/80">{title}</span>
        <span className="h-px w-8 bg-primary" />
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

import Image from "next/image";
import { imageUrl } from "../image";

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
    <div className="relative aspect-[2/3] w-full overflow-hidden bg-surface ring-1 ring-line">
      {src ? (
        <Image src={src} alt={`${title} poster`} fill sizes={sizes} priority={priority} className="object-cover" />
      ) : (
        <div className="flex h-full flex-col items-center justify-center gap-4 p-6 text-center">
          <span className="h-px w-8 bg-accent" />
          <span className="font-serif text-xl leading-snug text-foreground/80">{title}</span>
          <span className="h-px w-8 bg-accent" />
        </div>
      )}
    </div>
  );
}

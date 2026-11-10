export function LegalPage({ title, updated, children }: { title: string; updated: string; children: React.ReactNode }) {
  return (
    <div className="px-4 pb-24 pt-24 md:px-10 md:pt-28">
      <article className="mx-auto max-w-3xl">
        <p className="mb-2 text-sm font-semibold text-primary">Updated {updated}</p>
        <h1 className="mb-8 font-display text-4xl font-extrabold md:text-5xl">{title}</h1>
        <div className="space-y-5 leading-[1.85] text-foreground/80 [&_a]:text-primary [&_a]:underline-offset-4 hover:[&_a]:underline [&_h2]:mb-2 [&_h2]:mt-10 [&_h2]:font-display [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:text-foreground [&_li]:ml-5 [&_li]:list-disc">
          {children}
        </div>
      </article>
    </div>
  );
}

export const contactEmail = process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? "contact@your-domain.example";

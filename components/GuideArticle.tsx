import type { Metadata } from "next";
import Link from "next/link";
import { TrackOnMount } from "@/components/TrackOnMount";
import { ButtonLink } from "@/components/ui/Button";
import { Wordmark } from "@/components/ui/Wordmark";
import { GUIDES_BY_SLUG, type Guide } from "@/lib/guides";
import { ogImage } from "@/lib/og";

const long = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });

export function guide(slug: string): Guide {
  const g = GUIDES_BY_SLUG.get(slug);
  if (!g) throw new Error(`No guide "${slug}" in lib/guides.ts`);
  return g;
}

export function guideMetadata(slug: string): Metadata {
  const g = guide(slug);
  return {
    title: g.title,
    description: g.description,
    alternates: { canonical: `/guides/${g.slug}` },
    openGraph: { type: "article", title: g.title, description: g.description },
  };
}

export function guideOgImage(slug: string) {
  const g = guide(slug);
  return ogImage({ eyebrow: "Guide", title: g.title, line: g.description });
}

/** One guide from lib/guides.ts, with a quiet invitation to the quiz at the end. */
export function GuideArticle({ slug }: { slug: string }) {
  const g = guide(slug);
  return (
    <main className="mx-auto w-full max-w-[680px] px-5 pb-10">
      <TrackOnMount name="guide_view" props={{ guide: g.slug }} />
      <header className="flex items-center justify-between pt-3.5">
        <Link href="/" className="py-2">
          <Wordmark size={24} />
          <span className="sr-only"> home page</span>
        </Link>
        <Link href="/guides" className="px-1 py-3 text-[15px] font-medium text-bone hov:text-brass-light">
          All guides
        </Link>
      </header>

      <article className="mt-8">
        <h1 className="font-display text-[40px] leading-[0.98] font-extrabold sm:text-[50px]">{g.title}</h1>
        <p className="mt-3 text-[13px] text-moss">
          Updated {long.format(new Date(`${g.updated}T00:00:00Z`))}. {g.readMinutes}-minute read.
        </p>
        {g.intro.map((p) => (
          <p key={p} className="mt-4 text-[17px] leading-relaxed text-bone">
            {p}
          </p>
        ))}

        {g.blocks.map((b) => {
          const List = b.ordered ? "ol" : "ul";
          return (
            <section key={b.heading} className="mt-9">
              <h2 className="font-display text-[28px] leading-none font-extrabold">{b.heading}</h2>
              {b.paragraphs?.map((p) => (
                <p key={p} className="mt-3 text-base leading-relaxed text-bone">
                  {p}
                </p>
              ))}
              {b.list ? (
                <List
                  className={`mt-3 flex flex-col gap-2.5 pl-5 text-base leading-relaxed text-bone marker:text-brass ${b.ordered ? "list-decimal" : "list-disc"}`}
                >
                  {b.list.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </List>
              ) : null}
            </section>
          );
        })}

        {g.note ? (
          <p className="mt-9 rounded-xl border border-rule bg-ledger px-4 py-3 text-sm leading-normal text-moss">{g.note}</p>
        ) : null}
      </article>

      <aside className="mt-10 border-t border-rule pt-6" aria-label="EMPIRE OS">
        <h2 className="font-display text-[28px] leading-none font-extrabold">Want this as three missions a day?</h2>
        <p className="mt-2 text-[15px] text-moss">
          EMPIRE OS turns your next 90 days into a season of short daily missions for your career, body, mind and money,
          planned around your timetable, budget and free time.
        </p>
        <ButtonLink href="/quiz" className="mt-5">
          Find your archetype
        </ButtonLink>
        <p className="mt-3 text-center text-sm text-moss">Free 2-minute quiz. No card needed.</p>
      </aside>
    </main>
  );
}

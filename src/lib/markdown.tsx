import React from "react";

/** Tiny safe Markdown renderer for blog posts: builds React elements only, so no raw HTML can ever be injected. */
const SAFE_URL = /^(https?:\/\/|\/|#|mailto:)/i;

function inline(text: string, keyBase: string): React.ReactNode[] {
  const out: React.ReactNode[] = [];
  const re = /(!\[([^\]]*)\]\(([^)\s]+)\)|\[([^\]]+)\]\(([^)\s]+)\)|\*\*([^*]+)\*\*|\*([^*]+)\*)/g;
  let last = 0, m: RegExpExecArray | null, i = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const key = `${keyBase}-${i++}`;
    if (m[2] !== undefined && m[3]) {
      if (SAFE_URL.test(m[3])) /* eslint-disable-next-line @next/next/no-img-element */ out.push(<img key={key} src={m[3]} alt={m[2]} loading="lazy" className="my-4 w-full rounded-md" />);
    } else if (m[4] && m[5]) {
      out.push(SAFE_URL.test(m[5]) ? <a key={key} href={m[5]} className="text-clay underline" rel={m[5].startsWith("http") ? "noopener nofollow" : undefined}>{m[4]}</a> : m[4]);
    } else if (m[6]) out.push(<strong key={key}>{m[6]}</strong>);
    else if (m[7]) out.push(<em key={key}>{m[7]}</em>);
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

/** Same slug rule used for both rendering heading ids and building the table of contents, so links always match. */
export const slugifyHeading = (text: string) => text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

export type Heading = { id: string; text: string; level: 2 | 3 | 4 };

/** Pulls out # headings for a table of contents — AEO-friendly too, since it gives answer engines a map
 * of the article's sections (and deep-linkable anchors) without having to parse the whole body. */
export function extractHeadings(source: string): Heading[] {
  const blocks = source.replace(/\r\n/g, "\n").split(/\n{2,}/);
  const out: Heading[] = [];
  for (const b of blocks) {
    const h = b.trim().match(/^(#{1,3})\s+(.*)$/);
    if (h) out.push({ id: slugifyHeading(h[2]), text: h[2], level: (h[1].length + 1) as 2 | 3 | 4 });
  }
  return out;
}

export function Markdown({ source }: { source: string }) {
  const blocks = source.replace(/\r\n/g, "\n").split(/\n{2,}/);
  return (
    <div className="space-y-4 leading-relaxed text-graphite">
      {blocks.map((b, i) => {
        const t = b.trim();
        if (!t) return null;
        const h = t.match(/^(#{1,3})\s+(.*)$/);
        if (h) {
          const cls = h[1].length === 1 ? "text-3xl" : h[1].length === 2 ? "text-2xl" : "text-xl";
          const Tag = (`h${h[1].length + 1}`) as "h2" | "h3" | "h4";
          return <Tag key={i} id={slugifyHeading(h[2])} className={`font-serif-headline ${cls} scroll-mt-24 font-bold pt-2`}>{inline(h[2], `h${i}`)}</Tag>;
        }
        if (/^(-|\*)\s/.test(t)) {
          return <ul key={i} className="list-disc space-y-1 pl-6">{t.split("\n").map((l, j) => <li key={j}>{inline(l.replace(/^(-|\*)\s+/, ""), `l${i}-${j}`)}</li>)}</ul>;
        }
        if (/^\d+\.\s/.test(t)) {
          return <ol key={i} className="list-decimal space-y-1 pl-6">{t.split("\n").map((l, j) => <li key={j}>{inline(l.replace(/^\d+\.\s+/, ""), `o${i}-${j}`)}</li>)}</ol>;
        }
        if (t.startsWith(">")) return <blockquote key={i} className="border-l-4 border-clay pl-4 italic text-stone">{inline(t.replace(/^>\s?/gm, ""), `q${i}`)}</blockquote>;
        if (/^---+$/.test(t)) return <hr key={i} className="border-line" />;
        return <p key={i}>{inline(t.replace(/\n/g, " "), `p${i}`)}</p>;
      })}
    </div>
  );
}

// Scans the UI for <T k="…">default</T> and <Show k="…"> and writes the list the admin "Content" editor shows.
import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const walk = (d) => readdirSync(d).flatMap((n) => (statSync(join(d, n)).isDirectory() ? walk(join(d, n)) : [join(d, n)]));
const decode = (s) => s.replace(/&amp;/g, "&").replace(/&apos;|&#39;/g, "'").replace(/&quot;/g, '"').replace(/&ldquo;|&rdquo;/g, '"').trim();
const BACKSLASH = new RegExp(String.fromCharCode(92, 92), "g");

const texts = new Map();
const sections = new Set();
for (const f of [...walk("src/ui"), ...walk("src/app")].filter((f) => /\.tsx$/.test(f))) {
  const src = readFileSync(f, "utf8");
  for (const m of src.matchAll(/<T k="([^"]+)">([\s\S]*?)<\/T>/g)) {
    if (!texts.has(m[1])) {
      texts.set(m[1], { key: m[1], default: decode(m[2].replace(/\s+/g, " ")), file: f.replace(BACKSLASH, "/").replace("src/ui/", "").replace("src/app/", "") });
    }
  }
  // data-driven pages: 'key.name', 'Default text' pairs and <ContactLink k=".." def="..">
  if (/(StaticPages|ListingExtras)[.]tsx$/.test(f.replace(BACKSLASH, "/"))) {
    const add = (key, def) => { if (!texts.has(key)) texts.set(key, { key, default: decode(def), file: "pages/" + key.split(".")[0] }); };
    for (const m of src.matchAll(/'([a-z]+(?:\.[a-z0-9]+)+)',\s*'([^']*)'/g)) add(m[1], m[2]);
    for (const m of src.matchAll(/<ContactLink k="([^"]+)" def="([^"]+)"/g)) add(m[1], m[2]);
  }
  for (const m of src.matchAll(/<Show k="([^"]+)"/g)) sections.add(m[1]);
}
const out = { texts: [...texts.values()].sort((a, b) => a.key.localeCompare(b.key)), sections: [...sections].sort() };
writeFileSync("src/lib/content/registry.json", JSON.stringify(out, null, 1));
console.log(`content registry: ${out.texts.length} texts, ${out.sections.length} sections`);

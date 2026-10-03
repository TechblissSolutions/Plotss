// One-off codemod: wrap plain-text JSX lines in <T k="scope.slug">…</T> so the super admin can override them.
// Idempotent: already-wrapped lines are skipped. Only touches lines that are *only* text.
import { readFileSync, writeFileSync } from "node:fs";

const targets = [
  ["src/ui/screens/HomeScreen.tsx", "home"],
  ["src/ui/components/Header.tsx", "header"],
  ["src/ui/components/Footer.tsx", "footer"],
];

const slug = (t) => t.toLowerCase().replace(/&[a-z]+;/g, " ").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").split("-").slice(0, 6).join("-");

for (const [file, scope] of targets) {
  const lines = readFileSync(file, "utf8").split("\n");
  let n = 0;
  const out = lines.map((line) => {
    const m = line.match(/^(\s+)([A-Za-z0-9][^{}<>=;`]*[A-Za-z0-9.!?:)"'’”%+*→])\s*$/);
    if (!m) return line;
    const text = m[2];
    if (/^(import|export|const|let|return|if|else|case|default|function|type|interface)\b/.test(text)) return line;
    if (text.length < 4 || !/[a-z]/i.test(text)) return line;
    if (/^[A-Za-z]+[A-Za-z0-9]*[.,]?$/.test(text) && text.length < 6) return line;
    n++;
    return `${m[1]}<T k="${scope}.${slug(text)}">${text}</T>`;
  });
  let src = out.join("\n");
  if (n && !src.includes("import { T }")) {
    src = src.replace(/(\nimport [^\n]+\n)/, `$1import { T } from '../content';\n`);
  }
  writeFileSync(file, src);
  console.log(file, "wrapped:", n);
}

import { readFileSync, writeFileSync } from "node:fs";

const f = "src/ui/data/mockData.ts";
let s = readFileSync(f, "utf8");
s = s.replace(/^import .*\.jpg';\r?\n/gm, "");

const P = (n) => `/listings/${n}.jpg`;
const map = [
  ["hinjawadi", "vedira-greens", ["vedira-greens", "aurora-layout"]],
  ["lonavala", "greenwood-estate", ["greenwood-estate", "vrindavan-plot42"]],
  ["chakan", "midc-industrial", ["midc-industrial", "industrial-2", "industrial-3"]],
  ["sanand", "industrial-2", ["industrial-2", "midc-industrial"]],
  ["bhiwandi", "warehouse-1", ["warehouse-1", "warehouse-2"]],
  ["devanahalli", "plotted-aerial", ["plotted-aerial", "aurora-layout"]],
  ["alibaug", "vrindavan-plot42", ["vrindavan-plot42", "villa-corner"]],
  ["sriperumbudur", "industrial-3", ["industrial-3", "midc-industrial"]],
  ["hosur", "warehouse-2", ["warehouse-2", "warehouse-1"]],
  ["noida", "villa-corner", ["villa-corner", "plotted-aerial"]],
];

const parts = s.split(/(?=\n    slug: ')/);
let hits = 0;
const out = parts.map((seg) => {
  const m = seg.match(/^\n    slug: '([^']*)'/);
  if (!m) return seg;
  const hit = map.find(([k]) => m[1].includes(k));
  if (!hit) return seg;
  hits++;
  const [, main, gal] = hit;
  return seg
    .replace(/realImageUrl:\s*[^,\n]+,/, `realImageUrl: '${P(main)}',`)
    .replace(/galleryImages:\s*\[[^\]]*\]/, `galleryImages: [${gal.map((g) => `'${P(g)}'`).join(", ")}]`);
});
writeFileSync(f, out.join(""));
console.log("listings updated:", hits);

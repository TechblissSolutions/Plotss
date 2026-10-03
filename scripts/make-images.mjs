// One-off: derive extra demo images (crops) from the source photos and compress everything for the web.
import sharp from "sharp";
import { readdirSync, renameSync } from "node:fs";

const dir = "public/listings";
const crops = [
  ["midc-industrial.jpg", "industrial-2.jpg", { left: 700, top: 100, width: 676, height: 420 }],
  ["midc-industrial.jpg", "industrial-3.jpg", { left: 0, top: 150, width: 760, height: 430 }],
  ["industrial-drive-us.jpg", "warehouse-1.jpg", { left: 0, top: 60, width: 1376, height: 540 }], // excludes the road-marking text
  ["industrial-drive-us.jpg", "warehouse-2.jpg", { left: 760, top: 100, width: 616, height: 420 }],
];
for (const [src, out, region] of crops) {
  await sharp(`${dir}/${src}`).extract(region).resize({ width: 1200 }).jpeg({ quality: 78 }).toFile(`${dir}/${out}`);
}
for (const f of readdirSync(dir).filter((f) => /^(midc-industrial|vedira|greenwood|plotted|vrindavan|villa-corner|aurora)/.test(f))) {
  const tmp = `${dir}/_${f}`;
  await sharp(`${dir}/${f}`).resize({ width: 1400, withoutEnlargement: true }).jpeg({ quality: 78 }).toFile(tmp);
  renameSync(tmp, `${dir}/${f}`);
}
console.log(readdirSync(dir));

// Replace hard-coded brand hexes in the ported UI with theme tokens so the super-admin theme controls them.
import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const MAP = {
  "16181B": "graphite", "F7F4EF": "ivory", "6B6560": "stone", "B5502C": "clay", "C8FF4D": "signal", "3D5A40": "moss",
  "D5CEC2": "line", "E6E1D8": "line", "E0DAD0": "line", "D8D2C6": "line",
  "A49F98": "mist", "3D4046": "ink-2", "25292E": "ink-3", "2E3339": "ink-4", "2A2E33": "ink-4", "4D525A": "ink-4",
  "9B4222": "clay-dark", "EBE6DC": "sand", "F0ECE4": "sand", "F2EFE9": "sand", "FFFFFF": "white", "B6ED37": "signal",
};
const RADIUS = { "4px": "rounded-sm", "6px": "rounded-md", "8px": "rounded-md", "12px": "rounded-lg" };

const walk = (d) => readdirSync(d).flatMap((n) => (statSync(join(d, n)).isDirectory() ? walk(join(d, n)) : [join(d, n)]));
let changed = 0;
for (const file of walk("src/ui").filter((f) => /\.(tsx|ts)$/.test(f))) {
  let s = readFileSync(file, "utf8");
  const before = s;
  s = s.replace(/\[#([0-9A-Fa-f]{6})\]/g, (m, hex) => (MAP[hex.toUpperCase()] ? MAP[hex.toUpperCase()] : m));
  s = s.replace(/rounded-\[(4px|6px|8px|12px)\]/g, (m, px) => RADIUS[px]);
  if (/\/(components|screens)\//.test(file.replace(/\\/g, "/")) && !s.startsWith("'use client'") && !s.startsWith('"use client"')) {
    s = `'use client';\n${s}`;
  }
  if (s !== before) { writeFileSync(file, s); changed++; }
}
console.log("files changed:", changed);

import type { AreaUnit } from "./types";

export function formatINR(n: number): string {
  if (n >= 1e7) return `₹${+(n / 1e7).toFixed(2)} Cr`;
  if (n >= 1e5) return `₹${+(n / 1e5).toFixed(2)} Lakh`;
  return `₹${n.toLocaleString("en-IN")}`;
}

export function toAcres(value: number, unit: AreaUnit): number {
  if (unit === "acre") return value;
  if (unit === "sqft") return value / 43560;
  return value / 4046.86;
}

export function formatArea(value: number, unit: AreaUnit): string {
  const label = unit === "acre" ? (value === 1 ? "acre" : "acres") : unit;
  return `${value.toLocaleString("en-IN")} ${label}`;
}

/** "Rajesh Sharma" -> "R***** S*****", "+919876543210" -> "+91 98***3210"-style mask. */
export function maskName(name: string): string {
  return name
    .split(" ")
    .map((p) => p[0] + "*".repeat(Math.max(4, p.length - 1)))
    .join(" ");
}
export function maskPhone(phone: string): string {
  const d = phone.replace(/\D/g, "").slice(-10);
  return `+91 ${d.slice(0, 2)}***${d.slice(-3)}`;
}

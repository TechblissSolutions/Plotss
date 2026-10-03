import type { Listing } from "@/ui/types";

export type Quality = { score: number; tips: string[] };

const filled = (v?: string) => Boolean(v && v.trim() && !/^(n\/?a|na|-|none)$/i.test(v.trim()));

/** How complete a listing is (0-100), with plain-language tips for what to add. Complete listings get more calls. */
export function listingQuality(l: Listing): Quality {
  let score = 0;
  const tips: string[] = [];
  const photos = l.galleryImages?.length ?? (l.realImageUrl ? 1 : 0);
  if (photos >= 3) score += 25; else { score += photos * 8; tips.push(photos === 0 ? "Add photos of the land" : `Add ${3 - photos} more photo${3 - photos === 1 ? "" : "s"} (3 or more works best)`); }
  const desc = (l.aiDescription || l.rawDescription || "").trim().length;
  if (desc >= 200) score += 20; else { score += Math.round((desc / 200) * 20); tips.push("Write a longer description (at least 200 characters)"); }
  if (l.lat != null && l.lng != null) score += 20; else tips.push("Pin the exact location on the map");
  if (l.price > 0 && l.area > 0) score += 10; else tips.push("Add the price and the area");
  const facts = [l.roadWidth, l.frontage, l.powerSanction, l.waterAvailability].filter(filled).length;
  if (facts >= 2) score += 15; else { score += facts * 7; tips.push("Add road, power or water details"); }
  if (l.title.trim().length >= 30) score += 10; else { score += Math.round((l.title.trim().length / 30) * 10); tips.push("Use a more descriptive title"); }
  return { score: Math.min(100, score), tips };
}

import { describe, expect, it } from "vitest";
import { distanceKm, formatKm } from "../src/lib/geo";
import { listingQuality } from "../src/lib/listing-quality";
import { NCR_DEMO_LISTINGS } from "../src/ui/data/demoNcr";

describe("distance", () => {
  it("measures Noida to Ghaziabad at roughly 20 km", () => {
    const d = distanceKm({ lat: 28.5355, lng: 77.391 }, { lat: 28.6692, lng: 77.4538 });
    expect(d).toBeGreaterThan(15);
    expect(d).toBeLessThan(25);
  });
  it("is zero for the same point and formats nicely", () => {
    expect(distanceKm({ lat: 28, lng: 77 }, { lat: 28, lng: 77 })).toBe(0);
    expect(formatKm(0.4)).toBe("under 1 km");
    expect(formatKm(4.44)).toBe("4.4 km");
    expect(formatKm(19.6)).toBe("20 km");
  });
});

describe("listing quality", () => {
  const base = NCR_DEMO_LISTINGS[0];
  it("scores between 0 and 100 and explains what is missing", () => {
    const bare = { ...base, galleryImages: [], realImageUrl: undefined, aiDescription: "", rawDescription: "", lat: undefined, lng: undefined, title: "Plot" };
    const q = listingQuality(bare);
    expect(q.score).toBeGreaterThanOrEqual(0);
    expect(q.score).toBeLessThan(60);
    expect(q.tips.length).toBeGreaterThan(2);
  });
  it("gives a full listing a high score", () => {
    const full = { ...base, galleryImages: ["a", "b", "c"], aiDescription: "x".repeat(300), lat: 28.6, lng: 77.4, title: "A".repeat(40), roadWidth: "30 m", powerSanction: "33 KV" };
    expect(listingQuality(full).score).toBeGreaterThanOrEqual(90);
  });
});

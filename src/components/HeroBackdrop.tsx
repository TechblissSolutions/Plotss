"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

const Hero3D = dynamic(() => import("./Hero3D"), { ssr: false });

/** Loads the 3D scene only on capable, motion-tolerant devices so Lighthouse/mobile stay fast. */
export function HeroBackdrop() {
  const [on, setOn] = useState(false);
  useEffect(() => {
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const wide = matchMedia("(min-width: 768px)").matches;
    if (!reduce && wide) {
      const t = setTimeout(() => setOn(true), 300);
      return () => clearTimeout(t);
    }
  }, []);
  return <div className="absolute inset-0 opacity-70" aria-hidden>{on && <Hero3D />}</div>;
}

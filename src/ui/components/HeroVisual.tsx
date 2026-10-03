'use client';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ShieldCheck, TrendingUp } from 'lucide-react';
import React, { useRef } from 'react';

/**
 * Hero's right-side visual: a real listing photo (not the abstract SVG plot graphic, which read as
 * "placeholder" without a photo behind it) with two floating trust-signal cards and a gentle parallax
 * drift as the page scrolls, plus a slow float/idle motion so the panel never looks static.
 */
export const HeroVisual: React.FC<{ verifiedCount: number; avgPrice: string }> = ({ verifiedCount, avgPrice }) => {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
  const y = useTransform(scrollYProgress, [0, 1], [0, 60]);

  return (
    <div ref={ref} className="relative h-full w-full">
      <motion.div
        style={{ y }}
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="relative ml-auto aspect-[4/5] w-[88%] max-w-md overflow-hidden rounded-lg shadow-card sm:aspect-[5/6]"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/listings/plotted-aerial.jpg"
          alt="Aerial view of a plotted land development in the NCR region"
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-graphite/40 via-transparent to-transparent" />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, x: -16, y: 16 }}
        animate={{ opacity: 1, x: 0, y: [0, -6, 0] }}
        transition={{ opacity: { duration: 0.6, delay: 0.5 }, x: { duration: 0.6, delay: 0.5 }, y: { duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 1.1 } }}
        className="absolute left-0 top-[18%] flex items-center gap-2.5 rounded-sm border border-line bg-white/95 px-3.5 py-2.5 shadow-card backdrop-blur-sm sm:left-2"
      >
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full paint-moss text-ivory"><ShieldCheck className="h-4 w-4" /></span>
        <div className="leading-tight">
          <div className="text-sm font-bold text-graphite font-tabular">{verifiedCount}+</div>
          <div className="text-[11px] text-stone">Verified listings</div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, x: 16, y: -16 }}
        animate={{ opacity: 1, x: 0, y: [0, 7, 0] }}
        transition={{ opacity: { duration: 0.6, delay: 0.7 }, x: { duration: 0.6, delay: 0.7 }, y: { duration: 4.5, repeat: Infinity, ease: 'easeInOut', delay: 1.3 } }}
        className="absolute bottom-[14%] right-0 flex items-center gap-2.5 rounded-sm border border-line bg-white/95 px-3.5 py-2.5 shadow-card backdrop-blur-sm sm:right-2"
      >
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full paint-trust text-ivory"><TrendingUp className="h-4 w-4" /></span>
        <div className="leading-tight">
          <div className="text-sm font-bold text-graphite font-tabular">{avgPrice}</div>
          <div className="text-[11px] text-stone">Avg. asking price</div>
        </div>
      </motion.div>
    </div>
  );
};

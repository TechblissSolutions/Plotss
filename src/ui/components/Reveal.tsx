'use client';
import { motion, useReducedMotion } from 'framer-motion';
import React from 'react';

/** Scroll-triggered fade/slide-up wrapper — fires once, respects prefers-reduced-motion explicitly. */
export const Reveal: React.FC<{ children: React.ReactNode; delay?: number; className?: string; y?: number }> = ({
  children,
  delay = 0,
  className,
  y = 24,
}) => {
  const reduceMotion = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y }}
      whileInView={reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: reduceMotion ? 0.3 : 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
};

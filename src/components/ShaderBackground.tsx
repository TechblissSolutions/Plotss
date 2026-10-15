'use client';

/**
 * Radiant shader background — renders a topographic contour shader from
 * public/shaders/topographic.html as a sandboxed iframe.
 *
 * Usage:
 *   <ShaderBackground opacity={0.06} className="absolute inset-0" />
 *
 * The shader pauses automatically when scrolled out of view (handled inside
 * the HTML file by IntersectionObserver). Pointer events are disabled so it
 * never interferes with clicks.
 */

interface ShaderBackgroundProps {
  /** 0–1 opacity. Keep ≤ 0.10 for content-heavy sections. Default: 0.07 */
  opacity?: number;
  src?: string;
  className?: string;
}

export function ShaderBackground({
  opacity = 0.07,
  src = '/shaders/topographic.html',
  className = '',
}: ShaderBackgroundProps) {
  return (
    <iframe
      src={src}
      aria-hidden="true"
      tabIndex={-1}
      className={`pointer-events-none select-none ${className}`}
      style={{ opacity, border: 'none', display: 'block' }}
      sandbox="allow-scripts"
      loading="lazy"
      title=""
    />
  );
}

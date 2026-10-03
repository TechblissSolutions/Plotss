'use client';
import React, { useState } from 'react';
import { Camera, Layers, ShieldCheck } from 'lucide-react';

interface AbstractPlotVisualProps {
  variant?: 'card' | 'hero' | 'detail' | 'mini' | 'preview';
  geometryType?: 'rectangular' | 'corner' | 'l-shaped' | 'linear-highway';
  areaDisplay?: string;
  roadWidth?: string;
  aiScore?: number;
  className?: string;
  interactive?: boolean;
  realImageUrl?: string;
  category?: string;
}

export const AbstractPlotVisual: React.FC<AbstractPlotVisualProps> = ({
  variant = 'card',
  geometryType = 'rectangular',
  areaDisplay = '3.00 Acres',
  roadWidth = '30m Arterial Road',
  aiScore,
  className = '',
  interactive = false,
  realImageUrl,
  category,
}) => {
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [activeLayer, setActiveLayer] = useState<'boundary' | 'topo' | 'zoning'>('boundary');
  const [viewMode, setViewMode] = useState<'real' | 'cadastral'>(realImageUrl ? 'real' : 'cadastral');

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!interactive) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 12;
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * -12;
    setTilt({ x, y });
  };

  const handleMouseLeave = () => {
    if (!interactive) return;
    setTilt({ x: 0, y: 0 });
  };

  // Color variables according to brand
  const graphite = 'var(--c-graphite)';
  const clay = 'var(--c-clay)';
  const lime = 'var(--c-signal)';
  const moss = 'var(--c-moss)';
  const stone = 'var(--c-stone)';

  if (variant === 'hero') {
    return (
      <div 
        id="hero-abstract-3d-terrain"
        className={`relative w-full h-[480px] lg:h-[580px] overflow-hidden flex items-center justify-center select-none ${className}`}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{
          perspective: '1200px',
        }}
      >
        {/* Subtle grid background */}
        <div className="absolute inset-0 opacity-[0.07] pointer-events-none"
             style={{
               backgroundImage: `radial-gradient(${graphite} 1.2px, transparent 1.2px)`,
               backgroundSize: '24px 24px'
             }} 
        />

        {/* 3D Geometric Floating Land Parcels Canvas */}
        <div 
          className="relative transition-transform duration-300 ease-out will-change-transform"
          style={{
            transform: `rotateX(${22 + tilt.y}deg) rotateZ(${-18 + tilt.x}deg) rotateY(${tilt.x * 0.5}deg)`,
            transformStyle: 'preserve-3d'
          }}
        >
          {/* Ground Cadastral Plane */}
          <svg width="680" height="460" viewBox="0 0 680 460" className="drop-shadow-sm overflow-visible">
            <defs>
              <pattern id="cadastral-grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke={stone} strokeWidth="0.6" strokeOpacity="0.25" />
              </pattern>
              <linearGradient id="terracotta-parcel" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={clay} stopOpacity="0.14" />
                <stop offset="100%" stopColor={clay} stopOpacity="0.04" />
              </linearGradient>
            </defs>

            {/* Base Coordinate Grid */}
            <rect x="20" y="20" width="640" height="420" fill="url(#cadastral-grid)" rx="4" />
            <rect x="20" y="20" width="640" height="420" fill="none" stroke={graphite} strokeWidth="1" strokeOpacity="0.15" />

            {/* Contour Topo Elevation Curves */}
            <path d="M 40,320 Q 200,280 340,310 T 640,290" fill="none" stroke={graphite} strokeWidth="0.75" strokeDasharray="3 3" opacity="0.4" />
            <path d="M 30,240 Q 220,190 380,230 T 650,200" fill="none" stroke={graphite} strokeWidth="0.75" strokeDasharray="3 3" opacity="0.4" />
            <path d="M 50,150 Q 240,110 420,140 T 640,120" fill="none" stroke={graphite} strokeWidth="0.75" strokeDasharray="3 3" opacity="0.4" />

            {/* Road Corridor Frontage */}
            <path d="M 0,380 L 680,380" stroke={graphite} strokeWidth="24" strokeOpacity="0.08" />
            <path d="M 0,380 L 680,380" stroke={graphite} strokeWidth="1" strokeOpacity="0.3" />
            <path d="M 0,380 L 680,380" stroke={stone} strokeWidth="1" strokeDasharray="10 8" strokeOpacity="0.6" />
            <text x="50" y="374" fill={stone} fontSize="10" fontFamily="Inter" letterSpacing="0.08em" className="font-tabular">
              45M ARTERIAL INDUSTRIAL HIGHWAY CORRIDOR
            </text>

            {/* Surrounding Adjacent Parcels (Thin Wireframes) */}
            <polygon points="60,90 220,70 200,220 50,210" fill="none" stroke={graphite} strokeWidth="1" strokeOpacity="0.2" />
            <polygon points="440,80 620,95 590,240 430,220" fill="none" stroke={graphite} strokeWidth="1" strokeOpacity="0.2" />
            <text x="75" y="150" fill={stone} fontSize="9" opacity="0.5" fontFamily="Inter">PLOT #108 (3.2 AC)</text>
            <text x="470" y="160" fill={stone} fontSize="9" opacity="0.5" fontFamily="Inter">PLOT #110 (4.8 AC)</text>

            {/* Featured Parcel - Raised High-Fidelity Geometry */}
            <polygon 
              points="180,140 420,120 400,340 160,340" 
              fill="url(#terracotta-parcel)" 
              stroke={clay} 
              strokeWidth="2"
            />

            {/* Plot internal setbacks & buildable envelope */}
            <polygon 
              points="200,165 400,145 385,320 185,320" 
              fill="none" 
              stroke={clay} 
              strokeWidth="1" 
              strokeDasharray="4 3" 
              strokeOpacity="0.5"
            />

            {/* Dimension Lines */}
            <line x1="160" y1="352" x2="400" y2="352" stroke={clay} strokeWidth="1.2" />
            <circle cx="160" cy="352" r="2.5" fill={clay} />
            <circle cx="400" cy="352" r="2.5" fill={clay} />
            <text x="248" y="364" fill={clay} fontSize="10" fontWeight="600" fontFamily="Inter" className="font-tabular">
              195 FT FRONTAGE
            </text>

            <line x1="148" y1="140" x2="148" y2="340" stroke={stone} strokeWidth="1" />
            <circle cx="148" cy="140" r="2" fill={stone} />
            <circle cx="148" cy="340" r="2" fill={stone} />
            <text x="78" y="244" fill={stone} fontSize="10" fontWeight="500" fontFamily="Inter" className="font-tabular">
              670 FT DEPTH
            </text>

            {/* Vertex Coordinate Pins */}
            <g transform="translate(180, 140)">
              <circle cx="0" cy="0" r="4" fill={graphite} />
              <circle cx="0" cy="0" r="1.5" fill="var(--c-ivory)" />
              <text x="-8" y="-8" fill={graphite} fontSize="9" fontFamily="Inter" className="font-tabular">V1</text>
            </g>
            <g transform="translate(420, 120)">
              <circle cx="0" cy="0" r="4" fill={graphite} />
              <circle cx="0" cy="0" r="1.5" fill="var(--c-ivory)" />
              <text x="8" y="-8" fill={graphite} fontSize="9" fontFamily="Inter" className="font-tabular">V2 (18.725°N, 73.813°E)</text>
            </g>
            <g transform="translate(400, 340)">
              <circle cx="0" cy="0" r="4" fill={graphite} />
              <circle cx="0" cy="0" r="1.5" fill="var(--c-ivory)" />
              <text x="8" y="16" fill={graphite} fontSize="9" fontFamily="Inter" className="font-tabular">V3 (Road Access)</text>
            </g>
            <g transform="translate(160, 340)">
              <circle cx="0" cy="0" r="4" fill={graphite} />
              <circle cx="0" cy="0" r="1.5" fill="var(--c-ivory)" />
              <text x="-60" y="16" fill={graphite} fontSize="9" fontFamily="Inter" className="font-tabular">V4 (Ingress)</text>
            </g>

            {/* Center Area Badge */}
            <g transform="translate(265, 225)">
              <rect x="-65" y="-18" width="130" height="36" rx="4" fill={graphite} stroke="var(--c-line)" strokeWidth="1" />
              <text x="0" y="-1" textAnchor="middle" fill="var(--c-ivory)" fontSize="11" fontWeight="600" fontFamily="Inter" className="font-tabular">
                PARCEL #109
              </text>
              <text x="0" y="12" textAnchor="middle" fill={lime} fontSize="9" fontWeight="600" fontFamily="Inter" className="font-tabular">
                3.00 ACRES • CLEAR TITLE
              </text>
            </g>

            {/* AI Match Overlay Pin */}
            <g transform="translate(380, 190)">
              <rect x="0" y="0" width="76" height="24" rx="4" fill={lime} stroke={graphite} strokeWidth="1" />
              <text x="38" y="15" textAnchor="middle" fill={graphite} fontSize="10" fontWeight="700" fontFamily="Inter">
                ★ 97% AI MATCH
              </text>
            </g>

            {/* Power / Water Ingress Icons */}
            <g transform="translate(160, 270)">
              <rect x="-42" y="-10" width="36" height="20" rx="3" fill="var(--c-ivory)" stroke={graphite} strokeWidth="1" />
              <text x="-24" y="4" textAnchor="middle" fill={graphite} fontSize="9" fontWeight="600">33 KV</text>
            </g>
            <g transform="translate(400, 270)">
              <rect x="6" y="-10" width="36" height="20" rx="3" fill="var(--c-ivory)" stroke={moss} strokeWidth="1" />
              <text x="24" y="4" textAnchor="middle" fill={moss} fontSize="9" fontWeight="600">Water Line</text>
            </g>
          </svg>
        </div>

        {/* Floating Abstract Spec Pill (bottom right of hero 3D visual) */}
        <div className="absolute bottom-6 right-8 paint-graphite text-ivory px-4 py-2.5 rounded-sm border border-ink-2 shadow-sm hidden md:flex items-center gap-4 text-xs font-tabular">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full paint-signal" />
            <span>Illustrative outline</span>
          </div>
          <span className="text-stone">|</span>
          <span className="text-ivory/80">Not to scale</span>
          <span className="text-stone">|</span>
          <span className="text-signal font-semibold">Indicative outline</span>
        </div>
      </div>
    );
  }

  // Card Variant: Support both Real Plot Photography and 3D Cadastral Wireframe with instant switch!
  return (
    <div 
      className={`relative w-full aspect-[16/10] paint-graphite rounded-sm border border-ink-4 overflow-hidden group select-none ${className}`}
    >
      {/* Real Drone Photo Mode */}
      {viewMode === 'real' && realImageUrl ? (
        <div className="relative w-full h-full overflow-hidden">
          <img
            src={realImageUrl}
            alt={`${areaDisplay} land plot`}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
          />

          {/* Gradient readability scrim */}
          <div className="absolute inset-0 bg-gradient-to-t from-graphite/85 via-graphite/20 to-graphite/40 pointer-events-none" />

          {/* DGPS Boundary Demarcation Corner Overlays */}
          <div className="absolute inset-2 border border-ivory/40 rounded-[2px] pointer-events-none">
            {/* Top-Left Vertex Pin */}
            <div className="absolute -top-1 -left-1 w-2 h-2 paint-clay border border-ivory rounded-full" />
            {/* Top-Right Vertex Pin */}
            <div className="absolute -top-1 -right-1 w-2 h-2 paint-clay border border-ivory rounded-full" />
            {/* Bottom-Left Vertex Pin */}
            <div className="absolute -bottom-1 -left-1 w-2 h-2 paint-signal border border-graphite rounded-full" />
            {/* Bottom-Right Vertex Pin */}
            <div className="absolute -bottom-1 -right-1 w-2 h-2 paint-signal border border-graphite rounded-full" />
          </div>

          {/* Center Plot Tag */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="bg-graphite/85 backdrop-blur-xs text-ivory px-3 py-1 rounded-[3px] border border-ivory/25 text-xs font-bold font-tabular tracking-wider shadow-sm">
              {areaDisplay}
            </div>
          </div>
        </div>
      ) : (
        /* Cadastral Wireframe Mode */
        <div className="relative w-full h-full">
          {/* Precision Grid lines */}
          <div 
            className="absolute inset-0 opacity-15"
            style={{
              backgroundImage: 'linear-gradient(to right, var(--c-stone) 1px, transparent 1px), linear-gradient(to bottom, var(--c-stone) 1px, transparent 1px)',
              backgroundSize: '20px 20px'
            }}
          />

          <svg 
            viewBox="0 0 320 200" 
            className="w-full h-full p-2 transition-transform duration-500 ease-out group-hover:scale-105"
          >
            <defs>
              <linearGradient id={`grad-${geometryType}`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={clay} stopOpacity="0.25" />
                <stop offset="100%" stopColor={clay} stopOpacity="0.08" />
              </linearGradient>
            </defs>

            {/* Topo contour lines */}
            <path d="M 10,140 Q 90,120 180,135 T 310,125" fill="none" stroke="var(--c-stone)" strokeWidth="0.75" strokeDasharray="3 3" />
            <path d="M 10,80 Q 110,65 200,80 T 310,75" fill="none" stroke="var(--c-stone)" strokeWidth="0.75" strokeDasharray="3 3" />

            {/* Frontage Road Strip */}
            <line x1="0" y1="175" x2="320" y2="175" stroke="var(--c-graphite)" strokeWidth="12" />
            <line x1="0" y1="175" x2="320" y2="175" stroke="var(--c-stone)" strokeWidth="1" strokeDasharray="6 6" />

            {/* Main Parcel Geometry based on type */}
            {geometryType === 'corner' ? (
              <>
                <polygon points="60,40 250,30 230,165 40,165" fill={`url(#grad-${geometryType})`} stroke={clay} strokeWidth="1.5" />
                <polygon points="75,55 235,45 220,152 58,152" fill="none" stroke={clay} strokeWidth="0.75" strokeDasharray="3 3" strokeOpacity="0.6" />
              </>
            ) : geometryType === 'linear-highway' ? (
              <>
                <polygon points="30,60 290,50 280,165 20,165" fill={`url(#grad-${geometryType})`} stroke={clay} strokeWidth="1.5" />
                <line x1="30" y1="165" x2="290" y2="165" stroke={lime} strokeWidth="2" />
              </>
            ) : (
              <>
                <polygon points="70,45 245,35 230,165 55,165" fill={`url(#grad-${geometryType})`} stroke={clay} strokeWidth="1.5" />
                <polygon points="85,60 230,52 218,152 70,152" fill="none" stroke={clay} strokeWidth="0.75" strokeDasharray="3 3" strokeOpacity="0.6" />
              </>
            )}

            {/* Parcel Center Label */}
            <rect x="110" y="90" width="100" height="24" rx="3" fill="var(--c-graphite)" stroke="var(--c-stone)" strokeWidth="1" />
            <text x="160" y="106" textAnchor="middle" fill="var(--c-ivory)" fontSize="10" fontWeight="600" fontFamily="Inter" className="font-tabular">
              {areaDisplay}
            </text>

            {/* Road Frontage Indicator */}
            <text x="160" y="179" textAnchor="middle" fill="var(--c-stone)" fontSize="8" fontFamily="Inter" letterSpacing="0.05em">
              {roadWidth.toUpperCase()}
            </text>

            {/* Corner Coordinates */}
            <circle cx="70" cy="45" r="2.5" fill="var(--c-ivory)" />
            <circle cx="245" cy="35" r="2.5" fill="var(--c-ivory)" />
            <circle cx="230" cy="165" r="2.5" fill={clay} />
            <circle cx="55" cy="165" r="2.5" fill={clay} />
          </svg>
        </div>
      )}

      {/* View Switcher Pill (Real Photo vs 3D Cadastral) */}
      {realImageUrl && (
        <div className="absolute top-2.5 left-2.5 z-10">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setViewMode((prev) => (prev === 'real' ? 'cadastral' : 'real'));
            }}
            className="bg-graphite/90 hover:paint-graphite text-ivory text-[10px] font-semibold px-2 py-1 rounded-[3px] border border-ink-2 flex items-center gap-1.5 shadow-md cursor-pointer transition-colors"
            title="Click to toggle between Drone Site Photo and 3D Cadastral Survey"
          >
            {viewMode === 'real' ? (
              <>
                <Camera className="w-3 h-3 text-signal" />
                <span>Photo</span>
              </>
            ) : (
              <>
                <Layers className="w-3 h-3 text-clay" />
                <span>3D Cadastral</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* AI Match Score Badge (Signal Lime var(--c-signal)) */}
      {aiScore ? (
        <div className="absolute top-2.5 right-2.5 z-10 paint-signal text-graphite text-[11px] font-bold px-2 py-0.5 rounded-sm border border-graphite font-tabular tracking-tight flex items-center gap-1 shadow-sm">
          <span>{aiScore}%</span>
          <span className="text-[9px] font-medium opacity-80 uppercase">Match</span>
        </div>
      ) : null}

      {/* Bottom info strip */}
      <div className="absolute bottom-2 left-2.5 right-2.5 flex items-center justify-between text-[10px] text-mist font-tabular pointer-events-none z-10">
        <span className="bg-graphite/90 px-1.5 py-0.5 rounded-[3px] border border-ink-4 text-ivory">
          {category || 'CAD-ID'}: PLT-{(areaDisplay.replace(/\D/g, '') || '300')}
        </span>
        <span className="text-moss bg-ivory font-bold px-1.5 py-0.5 rounded-[3px] flex items-center gap-1">
          <ShieldCheck className="w-3 h-3 text-moss" />
          <span>OUTLINE ONLY</span>
        </span>
      </div>
    </div>
  );
};

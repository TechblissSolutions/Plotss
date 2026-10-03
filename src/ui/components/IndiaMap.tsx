'use client';
import React, { useRef, useState } from 'react';
import { ComposableMap, Geographies, Geography, Marker } from 'react-simple-maps';

export type MapCity = { slug: string; name: string; state: string; lat: number; lng: number; plotCount: number; comingSoon?: boolean };

const GEO_URL = '/data/india-states.geojson';

/**
 * India outline (real state boundaries, simplified from a public GeoJSON — see public/data/india-states.geojson)
 * with a pin per active city. Hover shows a tooltip right above that pin; click jumps straight into that
 * city's search results — the same destination as clicking the matching city card beside the map.
 */
export function IndiaMap({ cities, onSelectCity }: { cities: MapCity[]; onSelectCity: (city: MapCity) => void }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState<{ city: MapCity; x: number; y: number } | null>(null);

  const showTooltip = (city: MapCity, e: React.MouseEvent) => {
    const box = containerRef.current?.getBoundingClientRect();
    if (!box) return;
    setHovered({ city, x: e.clientX - box.left, y: e.clientY - box.top });
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <ComposableMap
        projection="geoMercator"
        projectionConfig={{ center: [82.5, 22.5], scale: 1050 }}
        width={520}
        height={520}
        style={{ width: '100%', height: 'auto' }}
      >
        <Geographies geography={GEO_URL}>
          {({ geographies }) =>
            geographies.map((geo) => (
              <Geography
                key={geo.rsmKey}
                geography={geo}
                className="fill-sand stroke-line outline-none transition-colors hover:fill-sand"
                style={{ outline: 'none' }}
              />
            ))
          }
        </Geographies>

        {cities.map((city) => (
          <Marker
            key={city.slug}
            coordinates={[city.lng, city.lat]}
            onMouseEnter={(e) => showTooltip(city, e)}
            onMouseMove={(e) => showTooltip(city, e)}
            onMouseLeave={() => setHovered((h) => (h?.city.slug === city.slug ? null : h))}
            onClick={() => { if (!city.comingSoon) onSelectCity(city); }}
            className={city.comingSoon ? 'cursor-default' : 'cursor-pointer'}
          >
            {/* Soft pulse ring behind the pin, like the reference screenshot — coming-soon pins are dimmer/smaller, honestly distinct from live markets */}
            <circle r={city.comingSoon ? 9 : 14} className={city.comingSoon ? 'fill-stone/15' : 'fill-clay/15'} />
            <circle r={city.comingSoon ? 3.5 : 5} className={city.comingSoon ? 'fill-stone stroke-ivory' : 'fill-clay stroke-ivory'} strokeWidth={2} />
          </Marker>
        ))}
      </ComposableMap>

      {hovered && (
        <div
          role="tooltip"
          className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-[calc(100%+10px)] whitespace-nowrap rounded-md border border-line bg-white px-3 py-1.5 text-xs font-semibold text-graphite shadow-md"
          style={{ left: hovered.x, top: hovered.y }}
        >
          {hovered.city.name}{' '}
          <span className="font-normal text-stone">
            · {hovered.city.comingSoon ? 'Coming soon' : `${hovered.city.plotCount} ${hovered.city.plotCount === 1 ? 'listing' : 'listings'}`}
          </span>
        </div>
      )}
    </div>
  );
}

'use client';
import React, { useState } from 'react';
import { Listing } from '../types';
import { X, Check, ArrowRight, ShieldCheck, Zap, Scale, Layers } from 'lucide-react';
import { AbstractPlotVisual } from './AbstractPlotVisual';

interface CompareTrayProps {
  selectedPlots: Listing[];
  onRemovePlot: (plotId: string) => void;
  onClearAll: () => void;
  onSelectForDetail: (slug: string) => void;
}

export const CompareTray: React.FC<CompareTrayProps> = ({
  selectedPlots,
  onRemovePlot,
  onClearAll,
  onSelectForDetail,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (selectedPlots.length === 0) return null;

  return (
    <>
      {/* Sticky Bottom Compare Tray */}
      <aside 
        id="sticky-compare-tray"
        aria-label="Listing comparison tray"
        className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 w-[95%] max-w-4xl paint-graphite text-ivory rounded-md border border-ink-2 shadow-2xl p-3 sm:p-4 flex items-center justify-between gap-4 animate-in fade-in slide-in-from-bottom-6 duration-300"
      >
        <div className="flex items-center gap-3 sm:gap-4 overflow-x-auto py-1">
          <div className="hidden sm:flex flex-col shrink-0">
            <span className="text-[11px] uppercase font-bold text-signal font-tabular tracking-wider">
              Land Parcel Comparison
            </span>
            <span className="text-xs text-mist">
              {selectedPlots.length} of 3 selected
            </span>
          </div>

          {/* Thumbnails */}
          <div className="flex items-center gap-2">
            {selectedPlots.map((plot) => (
              <div
                key={plot.id}
                className="relative flex items-center gap-2 bg-ink-3 border border-ink-2 rounded-sm p-1.5 pr-3 shrink-0"
              >
                <div className="w-10 h-7 rounded-[2px] overflow-hidden shrink-0">
                  <AbstractPlotVisual geometryType={plot.plotGeometryType} areaDisplay={plot.areaDisplay} />
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-xs font-bold font-tabular text-ivory leading-tight">
                    {plot.priceDisplay}
                  </span>
                  <span className="text-[11px] text-mist truncate max-w-[110px]">
                    {plot.city} • {plot.area} Ac
                  </span>
                </div>
                <button
                  onClick={() => onRemovePlot(plot.id)}
                  className="ml-1 p-0.5 text-mist hover:text-ivory rounded hover:bg-ink-2 cursor-pointer"
                  title="Remove"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}

            {selectedPlots.length < 3 && (
              <div className="hidden md:flex items-center justify-center border border-dashed border-ink-4 rounded-sm px-3 py-2 text-[11px] text-mist">
                + Select {3 - selectedPlots.length} more to compare
              </div>
            )}
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            id="clear-compare-tray-btn"
            onClick={onClearAll}
            className="text-xs text-mist hover:text-ivory underline px-2 py-1 cursor-pointer"
          >
            Clear
          </button>
          <button
            id="open-compare-modal-btn"
            onClick={() => setIsModalOpen(true)}
            disabled={selectedPlots.length < 2}
            className={`flex items-center gap-2 px-4 py-2 rounded-sm text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer ${
              selectedPlots.length >= 2
                ? 'paint-clay hover:bg-clay-dark text-ivory'
                : 'bg-ink-4 text-stone cursor-not-allowed'
            }`}
          >
            <span>Compare Now ({selectedPlots.length})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </aside>

      {/* Full Comparison Matrix Modal */}
      {isModalOpen && (
        <div 
          id="compare-modal-backdrop"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-graphite/80 backdrop-blur-xs"
        >
          <div 
            id="compare-modal-dialog"
            className="relative w-full max-w-5xl max-h-[90vh] bg-ivory rounded-md border border-graphite shadow-2xl p-6 sm:p-8 text-graphite overflow-y-auto"
          >
            <div className="flex items-start justify-between pb-4 border-b border-line">
              <div>
                <span className="text-xs font-bold text-clay uppercase tracking-wider font-tabular">
                  Due Diligence Benchmark
                </span>
                <h2 className="font-serif-headline text-2xl sm:text-3xl font-bold text-graphite mt-0.5">
                  Side-by-Side Land Parcel Analysis
                </h2>
              </div>
              <button
                id="close-compare-modal-btn"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-stone hover:text-graphite hover:bg-line rounded-sm cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Comparison Table */}
            <div className="mt-6 overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-line">
                    <th className="p-3 text-xs uppercase font-semibold text-stone w-48 bg-sand">
                      Metric / Specification
                    </th>
                    {selectedPlots.map((plot) => (
                      <th key={plot.id} className="p-3 w-64 align-top">
                        <div className="h-28 rounded-sm overflow-hidden mb-2">
                          <AbstractPlotVisual geometryType={plot.plotGeometryType} areaDisplay={plot.areaDisplay} />
                        </div>
                        <h3 className="font-serif-headline text-base font-bold text-graphite line-clamp-2">
                          {plot.title}
                        </h3>
                        <div className="text-sm font-bold text-clay font-tabular mt-1">
                          {plot.priceDisplay}
                        </div>
                        <div className="text-xs text-stone font-tabular">
                          {plot.pricePerUnit}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="text-xs divide-y divide-line">
                  {/* AI Match Score */}
                  <tr>
                    <td className="p-3 font-semibold text-stone bg-sand">AI Match Score</td>
                    {selectedPlots.map((p) => (
                      <td key={p.id} className="p-3 font-tabular">
                        <span className="inline-flex items-center gap-1 paint-signal text-graphite font-bold px-2.5 py-1 rounded-[3px] border border-graphite">
                          {p.aiMatchScore > 0 ? `★ ${p.aiMatchScore}% Score` : '—'}
                        </span>
                      </td>
                    ))}
                  </tr>

                  {/* Area & Frontage */}
                  <tr>
                    <td className="p-3 font-semibold text-stone bg-sand">Area & Dimensions</td>
                    {selectedPlots.map((p) => (
                      <td key={p.id} className="p-3 font-tabular">
                        <div className="font-bold text-graphite">{p.areaDisplay}</div>
                        <div className="text-stone">{p.frontage}</div>
                      </td>
                    ))}
                  </tr>

                  {/* Road Width & Ingress */}
                  <tr>
                    <td className="p-3 font-semibold text-stone bg-sand">Road Width</td>
                    {selectedPlots.map((p) => (
                      <td key={p.id} className="p-3 font-medium text-graphite">
                        {p.roadWidth}
                      </td>
                    ))}
                  </tr>

                  {/* Zoning Classification */}
                  <tr>
                    <td className="p-3 font-semibold text-stone bg-sand">Zoning & Permissibility</td>
                    {selectedPlots.map((p) => (
                      <td key={p.id} className="p-3">
                        <span className="inline-block paint-graphite text-ivory px-2 py-0.5 rounded-[3px] font-tabular font-medium text-[11px]">
                          {p.zoneType}
                        </span>
                        <div className="text-stone mt-1">FAR / FSI: {p.farFsi}</div>
                      </td>
                    ))}
                  </tr>

                  {/* Power Infrastructure */}
                  <tr>
                    <td className="p-3 font-semibold text-stone bg-sand">Power & Utilities</td>
                    {selectedPlots.map((p) => (
                      <td key={p.id} className="p-3">
                        <div className="font-semibold text-graphite">{p.powerSanction}</div>
                        <div className="text-stone">{p.waterAvailability}</div>
                      </td>
                    ))}
                  </tr>

                  {/* Price Valuation Delta */}
                  <tr>
                    <td className="p-3 font-semibold text-stone bg-sand">Corridor Valuation</td>
                    {selectedPlots.map((p) => (
                      <td key={p.id} className="p-3">
                        <span className="font-semibold text-moss">{p.fairnessRating}</span>
                        <div className="text-stone">{p.fairnessDelta}</div>
                      </td>
                    ))}
                  </tr>

                  {/* DGPS Survey & Documents */}
                  <tr>
                    <td className="p-3 font-semibold text-stone bg-sand">Legal Verification</td>
                    {selectedPlots.map((p) => (
                      <td key={p.id} className="p-3">
                        <div className="flex items-center gap-1.5 text-moss font-bold">
                          <ShieldCheck className="w-4 h-4" />
                          <span>{p.verified ? 'Documents verified' : p.aiScreened ? 'AI-screened' : 'Listed'}</span>
                        </div>
                        <div className="text-stone mt-0.5">{p.documents.length} Due Diligence Docs</div>
                      </td>
                    ))}
                  </tr>

                  {/* Actions */}
                  <tr>
                    <td className="p-3 bg-sand"></td>
                    {selectedPlots.map((p) => (
                      <td key={p.id} className="p-3">
                        <button
                          onClick={() => {
                            setIsModalOpen(false);
                            onSelectForDetail(p.slug);
                          }}
                          className="w-full paint-graphite hover:paint-clay text-ivory text-xs font-semibold py-2 px-3 rounded-sm transition-colors cursor-pointer"
                        >
                          View Full Dossier
                        </button>
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

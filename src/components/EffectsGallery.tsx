/**
 * Effects Gallery Screen
 * Interactive showcase of all 26 motion graphics effect IDs.
 * Each card renders a real-time animated mini-canvas loop.
 */

import React, { useState, useEffect, useRef } from 'react';
import { EFFECTS_CATALOG } from '../engine/effects';
import { EffectId, Layer } from '../types';
import { renderLayer } from '../engine/renderer';
import { Sparkles, Check, CheckSquare, Square, Search, ArrowRight } from 'lucide-react';

interface EffectsGalleryProps {
  selectedEffects: Set<EffectId>;
  onToggleEffect: (id: EffectId) => void;
  onSelectAll: () => void;
  onClearSelection: () => void;
  onNavigateToScript: () => void;
}

// Mini Canvas animated preview component
const MiniEffectPreview: React.FC<{ effectId: EffectId }> = ({ effectId }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let startTime = performance.now();
    const duration = 2200; // loop period in ms

    // Synthesize a representative layer for this effect
    const isCode = effectId === 'code-typewriter' || effectId === 'line-highlight' || effectId === 'zoom-to-line';
    const isMarker = effectId === 'highlight-sweep' || effectId === 'underline-draw' || effectId === 'circle-marker' || effectId === 'box-marker' || effectId === 'draw-arrow' || effectId === 'path-arrow';
    const isCard = effectId === 'slide-card';

    const testLayer: Layer = {
      id: `preview-${effectId}`,
      type: isCode ? 'code' : isCard ? 'card' : isMarker ? 'text' : 'text',
      effect: effectId,
      startMs: 250,
      durationMs: 1200,
      x: isCode ? 16 : isCard ? 20 : 25,
      y: isCode ? 14 : isCard ? 30 : 45,
      w: isCode ? 228 : isCard ? 220 : 210,
      h: isCode ? 120 : isCard ? 85 : 55,
      text: effectId === 'counter-up' ? '99% DEVS' : effectId === 'keyword-pulse' ? 'SPRING MOTION' : 'MOTION TEXT',
      code: `const ease = spring({\n  bounce: 0.4,\n});`,
      color: '#FFFFFF',
      bg: isCode ? '#11121B' : isCard ? '#161724' : '#00000000',
      fontSize: isCode ? 15 : isCard ? 16 : 22,
      borderRadius: 10,
      spring: 'snappy',
      highlightLine: 2,
    };

    const loop = (now: number) => {
      const elapsed = (now - startTime) % duration;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#10111A';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Subtle grid dots in background
      ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
      for (let x = 15; x < canvas.width; x += 25) {
        for (let y = 15; y < canvas.height; y += 25) {
          ctx.beginPath();
          ctx.arc(x, y, 1, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Render the test layer
      renderLayer(ctx, testLayer, elapsed, canvas.width, canvas.height);

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [effectId]);

  return (
    <div className="relative w-full h-36 bg-[#10111A] rounded-lg overflow-hidden border border-white/5 flex items-center justify-center">
      <canvas
        ref={canvasRef}
        width={260}
        height={144}
        className="w-full h-full object-contain"
      />
    </div>
  );
};

export const EffectsGallery: React.FC<EffectsGalleryProps> = ({
  selectedEffects,
  onToggleEffect,
  onSelectAll,
  onClearSelection,
  onNavigateToScript,
}) => {
  const [filterCategory, setFilterCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const categories = [
    'All',
    'Entrance',
    'Text & Typing',
    'Markers & Highlights',
    'Dynamic & Camera',
    'Continuous',
  ];

  const filteredEffects = EFFECTS_CATALOG.filter((eff) => {
    const matchesCategory = filterCategory === 'All' || eff.category === filterCategory;
    const matchesSearch =
      eff.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      eff.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      eff.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="flex-1 overflow-y-auto bg-[#0B0B10] p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header Title & Description */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-[#FFD54F] tracking-wider uppercase mb-1">
              <Sparkles className="w-3.5 h-3.5" />
              Complete Catalog ({EFFECTS_CATALOG.length} Motion Effects)
            </div>
            <h1 className="text-2xl lg:text-3xl font-extrabold text-white tracking-tight">
              Motion Graphics Effects Gallery
            </h1>
            <p className="text-slate-400 text-sm mt-1 max-w-2xl">
              Deterministic 60fps motion primitives powered by GSAP mathematical curves & damped spring oscillators.
              Select effects to include them in your generated script.
            </p>
          </div>

          {/* Action Toolbar */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={onSelectAll}
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-colors"
            >
              Select All (26)
            </button>
            <button
              onClick={onClearSelection}
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-colors"
            >
              Clear
            </button>
            <button
              onClick={onNavigateToScript}
              disabled={selectedEffects.size === 0}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                selectedEffects.size > 0
                  ? 'bg-[#FFD54F] text-[#0B0B10] hover:bg-[#FFE082] shadow-sm shadow-[#FFD54F]/25 cursor-pointer'
                  : 'bg-white/5 text-slate-500 border border-white/5 cursor-not-allowed'
              }`}
            >
              <span>Create Script with Selected ({selectedEffects.size})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto p-1 bg-white/5 rounded-xl border border-white/10">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setFilterCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                  filterCategory === cat
                    ? 'bg-white/15 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter by name, curve or tag..."
              className="w-full pl-9 pr-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#FFD54F] transition-colors"
            />
          </div>
        </div>

        {/* Effects Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredEffects.map((eff) => {
            const isSelected = selectedEffects.has(eff.id);

            return (
              <div
                key={eff.id}
                onClick={() => onToggleEffect(eff.id)}
                className={`group relative rounded-xl border p-4 bg-[#14151F] transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'border-[#FFD54F] ring-1 ring-[#FFD54F]/40 shadow-lg shadow-[#FFD54F]/5'
                    : 'border-white/10 hover:border-white/20 hover:bg-[#181926]'
                }`}
              >
                <div>
                  {/* Header: Effect ID & Checkbox */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-5 h-5 rounded flex items-center justify-center transition-colors ${
                          isSelected
                            ? 'bg-[#FFD54F] text-[#0B0B10]'
                            : 'border border-white/20 bg-white/5 text-transparent group-hover:border-white/40'
                        }`}
                      >
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                      <span className="font-mono text-xs font-bold text-white tracking-tight">
                        {eff.id}
                      </span>
                    </div>

                    <span className="text-[11px] font-medium text-slate-400">
                      {eff.category}
                    </span>
                  </div>

                  {/* Live Canvas Mini Preview */}
                  <MiniEffectPreview effectId={eff.id} />

                  {/* Description */}
                  <p className="text-xs text-slate-300 mt-3 line-clamp-2 leading-relaxed">
                    {eff.description}
                  </p>
                </div>

                {/* Footer metadata */}
                <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                  <span>ease: {eff.defaultEasing}</span>
                  <span>{eff.defaultDurationMs}ms</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

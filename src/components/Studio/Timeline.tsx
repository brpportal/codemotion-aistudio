/**
 * Studio Timeline Component
 * Multi-track sequencer with seconds ruler, draggable playhead,
 * layer bars with body dragging & edge trimming, and zoom controls.
 */

import React, { useRef, useState } from 'react';
import { Scene, Layer } from '../../types';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Type,
  Code2,
  Square,
  Image as ImageIcon,
  Highlighter,
} from 'lucide-react';

interface TimelineProps {
  scene: Scene;
  playheadMs: number;
  selectedLayerId: string | null;
  onPlayheadChange: (timeMs: number) => void;
  onSelectLayer: (layerId: string | null) => void;
  onUpdateLayer: (layerId: string, updates: Partial<Layer>) => void;
}

export const Timeline: React.FC<TimelineProps> = ({
  scene,
  playheadMs,
  selectedLayerId,
  onPlayheadChange,
  onSelectLayer,
  onUpdateLayer,
}) => {
  const [zoom, setZoom] = useState(1.0); // 1.0 to 3.0
  const tracksContainerRef = useRef<HTMLDivElement | null>(null);

  // Dragging state for layer bar or playhead
  const [draggingPlayhead, setDraggingPlayhead] = useState(false);
  const [dragBarState, setDragBarState] = useState<{
    layerId: string;
    mode: 'move' | 'trim-start' | 'trim-end';
    startX: number;
    initialStartMs: number;
    initialDurationMs: number;
  } | null>(null);

  const durationMs = Math.max(500, scene.durationMs);

  // Get layer type icon helper
  const getLayerIcon = (type: string) => {
    switch (type) {
      case 'text':
        return <Type className="w-3.5 h-3.5 text-[#FFD54F]" />;
      case 'code':
        return <Code2 className="w-3.5 h-3.5 text-sky-400" />;
      case 'card':
        return <Square className="w-3.5 h-3.5 text-emerald-400" />;
      case 'image':
        return <ImageIcon className="w-3.5 h-3.5 text-purple-400" />;
      case 'highlight':
        return <Highlighter className="w-3.5 h-3.5 text-amber-400" />;
      default:
        return <Type className="w-3.5 h-3.5 text-slate-400" />;
    }
  };

  // Helper to convert mouse event clientX to time in ms
  const getTimeFromEvent = (e: React.MouseEvent | MouseEvent | React.PointerEvent) => {
    if (!tracksContainerRef.current) return 0;
    const rect = tracksContainerRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const progress = Math.max(0, Math.min(1, clickX / rect.width));
    return Math.round(progress * durationMs);
  };

  // Handle Playhead Scrubbing on Ruler
  const handleRulerPointerDown = (e: React.PointerEvent) => {
    const time = getTimeFromEvent(e);
    onPlayheadChange(time);
    setDraggingPlayhead(true);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handleRulerPointerMove = (e: React.PointerEvent) => {
    if (draggingPlayhead) {
      const time = getTimeFromEvent(e);
      onPlayheadChange(time);
    }
  };

  const handleRulerPointerUp = () => {
    setDraggingPlayhead(false);
  };

  // Handle Layer Bar Interaction (Move or Trim)
  const handleBarPointerDown = (
    e: React.PointerEvent,
    layer: Layer,
    mode: 'move' | 'trim-start' | 'trim-end'
  ) => {
    e.stopPropagation();
    onSelectLayer(layer.id);
    if (layer.locked) return;

    setDragBarState({
      layerId: layer.id,
      mode,
      startX: e.clientX,
      initialStartMs: layer.startMs,
      initialDurationMs: layer.durationMs,
    });
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handleBarPointerMove = (e: React.PointerEvent) => {
    if (!dragBarState || !tracksContainerRef.current) return;

    const rect = tracksContainerRef.current.getBoundingClientRect();
    const deltaX = e.clientX - dragBarState.startX;
    const msPerPx = durationMs / rect.width;
    const deltaMs = Math.round(deltaX * msPerPx);

    const layer = scene.layers.find((l) => l.id === dragBarState.layerId);
    if (!layer) return;

    if (dragBarState.mode === 'move') {
      const newStartMs = Math.max(
        0,
        Math.min(durationMs - dragBarState.initialDurationMs, dragBarState.initialStartMs + deltaMs)
      );
      onUpdateLayer(layer.id, { startMs: newStartMs });
    } else if (dragBarState.mode === 'trim-start') {
      const maxStart = dragBarState.initialStartMs + dragBarState.initialDurationMs - 100;
      const newStartMs = Math.max(0, Math.min(maxStart, dragBarState.initialStartMs + deltaMs));
      const newDurationMs = (dragBarState.initialStartMs + dragBarState.initialDurationMs) - newStartMs;
      onUpdateLayer(layer.id, {
        startMs: newStartMs,
        durationMs: Math.max(100, newDurationMs),
      });
    } else if (dragBarState.mode === 'trim-end') {
      const maxDuration = durationMs - dragBarState.initialStartMs;
      const newDurationMs = Math.max(100, Math.min(maxDuration, dragBarState.initialDurationMs + deltaMs));
      onUpdateLayer(layer.id, { durationMs: newDurationMs });
    }
  };

  const handleBarPointerUp = () => {
    setDragBarState(null);
  };

  // Seconds ruler marks
  const totalSeconds = Math.ceil(durationMs / 1000);
  const secondMarks = Array.from({ length: totalSeconds + 1 }, (_, i) => i);

  return (
    <div className="h-64 bg-[#10111A] border-t border-white/10 flex flex-col select-none shrink-0 overflow-hidden">
      {/* Timeline Header Bar: Title, Zoom Controls, Timecode */}
      <div className="h-9 px-4 bg-[#141522] border-b border-white/10 flex items-center justify-between text-xs text-slate-300 shrink-0">
        <div className="flex items-center gap-3">
          <span className="font-bold text-white text-[11px] tracking-wider uppercase flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#FFD54F]" />
            Timeline Sequencer
          </span>
          <span className="text-slate-500 text-[11px]">
            {scene.layers.length} Layer Tracks
          </span>
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setZoom((z) => Math.max(1.0, z - 0.25))}
            title="Zoom Out"
            className="p-1 rounded hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="text-[10px] font-mono text-slate-400 w-10 text-center">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={() => setZoom((z) => Math.min(3.0, z + 0.25))}
            title="Zoom In"
            className="p-1 rounded hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setZoom(1.0)}
            title="Reset Zoom"
            className="p-1 rounded hover:bg-white/10 text-slate-400 hover:text-white transition-colors ml-1"
          >
            <Maximize2 className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Main Timeline Body (Headers on Left + Tracks on Right) */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Layer Track Headers */}
        <div className="w-64 border-r border-white/10 bg-[#12131C] shrink-0 flex flex-col overflow-y-auto">
          {/* Ruler Corner Spacer */}
          <div className="h-7 border-b border-white/10 px-3 flex items-center text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
            Layer Stack
          </div>

          {/* Layer Headers List */}
          <div className="flex-1 divide-y divide-white/5">
            {scene.layers.map((layer) => {
              const isSelected = layer.id === selectedLayerId;
              const label =
                layer.text ||
                (layer.type === 'code' ? 'Code Snippet' : layer.type.toUpperCase());

              return (
                <div
                  key={layer.id}
                  onClick={() => onSelectLayer(layer.id)}
                  className={`h-9 px-3 flex items-center justify-between gap-2 text-xs transition-colors cursor-pointer ${
                    isSelected ? 'bg-white/10 text-white' : 'hover:bg-white/5 text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate flex-1">
                    {getLayerIcon(layer.type)}
                    <span className="truncate text-xs font-medium">
                      {label}
                    </span>
                  </div>

                  {/* Lock & Visibility Toggles */}
                  <div className="flex items-center gap-1 shrink-0 text-slate-500">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onUpdateLayer(layer.id, { hidden: !layer.hidden });
                      }}
                      title={layer.hidden ? 'Show Layer' : 'Hide Layer'}
                      className="p-1 hover:text-white transition-colors"
                    >
                      {layer.hidden ? (
                        <EyeOff className="w-3 h-3 text-red-400" />
                      ) : (
                        <Eye className="w-3 h-3 text-slate-400" />
                      )}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onUpdateLayer(layer.id, { locked: !layer.locked });
                      }}
                      title={layer.locked ? 'Unlock Layer' : 'Lock Layer'}
                      className="p-1 hover:text-white transition-colors"
                    >
                      {layer.locked ? (
                        <Lock className="w-3 h-3 text-[#FFD54F]" />
                      ) : (
                        <Unlock className="w-3 h-3 text-slate-400" />
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Seconds Ruler & Sequencer Bars */}
        <div className="flex-1 flex flex-col overflow-x-auto overflow-y-hidden relative bg-[#0D0E16]">
          {/* Scrollable Container */}
          <div
            ref={tracksContainerRef}
            className="flex-1 flex flex-col relative min-w-full"
            style={{ width: `${zoom * 100}%` }}
          >
            {/* Seconds Ruler */}
            <div
              className="h-7 border-b border-white/10 bg-[#141520] relative cursor-pointer select-none"
              onPointerDown={handleRulerPointerDown}
              onPointerMove={handleRulerPointerMove}
              onPointerUp={handleRulerPointerUp}
            >
              {secondMarks.map((sec) => {
                const pct = (sec * 1000) / durationMs;
                if (pct > 1.05) return null;

                return (
                  <div
                    key={sec}
                    className="absolute top-0 bottom-0 flex flex-col justify-between"
                    style={{ left: `${pct * 100}%` }}
                  >
                    <span className="text-[10px] font-mono text-slate-400 -translate-x-1/2 pt-0.5 pointer-events-none">
                      {sec}s
                    </span>
                    <div className="w-[1px] h-2 bg-white/20 -translate-x-1/2" />
                  </div>
                );
              })}

              {/* Minor 500ms ticks */}
              {Array.from({ length: totalSeconds * 2 + 1 }, (_, i) => i * 500).map((ms) => {
                const pct = ms / durationMs;
                if (pct > 1.05 || ms % 1000 === 0) return null;
                return (
                  <div
                    key={ms}
                    className="absolute bottom-0 w-[1px] h-1.5 bg-white/10 -translate-x-1/2 pointer-events-none"
                    style={{ left: `${pct * 100}%` }}
                  />
                );
              })}
            </div>

            {/* Sequencer Track Rows */}
            <div className="flex-1 divide-y divide-white/5 relative overflow-y-auto">
              {scene.layers.map((layer) => {
                const isSelected = layer.id === selectedLayerId;
                const leftPct = (layer.startMs / durationMs) * 100;
                const widthPct = (layer.durationMs / durationMs) * 100;

                return (
                  <div
                    key={layer.id}
                    onClick={() => onSelectLayer(layer.id)}
                    className="h-9 relative bg-white/[0.01] hover:bg-white/[0.03] transition-colors"
                  >
                    {/* The Layer Duration Bar */}
                    <div
                      onPointerDown={(e) => handleBarPointerDown(e, layer, 'move')}
                      onPointerMove={handleBarPointerMove}
                      onPointerUp={handleBarPointerUp}
                      style={{
                        left: `${leftPct}%`,
                        width: `${Math.max(1, widthPct)}%`,
                      }}
                      className={`absolute top-1 bottom-1 rounded-md flex items-center justify-between px-2 cursor-grab active:cursor-grabbing text-[11px] font-mono font-medium truncate select-none shadow-sm transition-shadow ${
                        isSelected
                          ? 'bg-[#FFD54F] text-[#0B0B10] ring-2 ring-[#FFD54F]/50 shadow-md shadow-[#FFD54F]/10'
                          : 'bg-[#25283B] text-slate-200 hover:bg-[#2F3249] border border-white/10'
                      }`}
                    >
                      {/* Left Trim Handle */}
                      {!layer.locked && (
                        <div
                          onPointerDown={(e) => handleBarPointerDown(e, layer, 'trim-start')}
                          className="absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-white/40 rounded-l-md"
                          title="Trim Start"
                        />
                      )}

                      {/* Bar Content */}
                      <span className="truncate pointer-events-none">
                        {layer.effect} ({layer.durationMs}ms)
                      </span>

                      {/* Right Trim Handle */}
                      {!layer.locked && (
                        <div
                          onPointerDown={(e) => handleBarPointerDown(e, layer, 'trim-end')}
                          className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-white/40 rounded-r-md"
                          title="Trim Duration"
                        />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Draggable Playhead Needle */}
            <div
              className="absolute top-0 bottom-0 w-[2px] bg-[#FFD54F] pointer-events-none z-20 shadow-md shadow-[#FFD54F]/50"
              style={{ left: `${(playheadMs / durationMs) * 100}%` }}
            >
              {/* Playhead Head Marker */}
              <div className="absolute top-0 -left-2.5 w-5 h-5 bg-[#FFD54F] text-[#0B0B10] rounded-b-md flex items-center justify-center shadow-md font-mono text-[9px] font-bold">
                ▼
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

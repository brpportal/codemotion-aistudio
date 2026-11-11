/**
 * Canvas Player & Interactive Viewport
 * 1080x1920 (9:16) HTML Canvas 2D with direct on-canvas layer manipulation,
 * snap guides, playhead controls, and add-layer buttons.
 */

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Scene, Layer, LayerType } from '../../types';
import { renderScene, globalImageCache } from '../../engine/renderer';
import {
  Play,
  Pause,
  RotateCcw,
  Repeat,
  Type,
  Code2,
  Square,
  Image as ImageIcon,
  Highlighter,
  Maximize2,
  ZoomIn,
} from 'lucide-react';

interface CanvasPlayerProps {
  scene: Scene;
  playheadMs: number;
  isPlaying: boolean;
  isLooping: boolean;
  selectedLayerId: string | null;
  onPlayheadChange: (timeMs: number) => void;
  onTogglePlay: () => void;
  onToggleLoop: () => void;
  onSelectLayer: (layerId: string | null) => void;
  onUpdateLayer: (layerId: string, updates: Partial<Layer>) => void;
  onAddLayer: (type: LayerType) => void;
}

export const CanvasPlayer: React.FC<CanvasPlayerProps> = ({
  scene,
  playheadMs,
  isPlaying,
  isLooping,
  selectedLayerId,
  onPlayheadChange,
  onTogglePlay,
  onToggleLoop,
  onSelectLayer,
  onUpdateLayer,
  onAddLayer,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [zoomLevel, setZoomLevel] = useState<'fit' | '50' | '75' | '100'>('fit');
  const [scale, setScale] = useState(0.4);

  // Dragging and interaction state
  const [dragMode, setDragMode] = useState<'move' | 'nw' | 'ne' | 'se' | 'sw' | null>(null);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [initialLayerRect, setInitialLayerRect] = useState<{ x: number; y: number; w: number; h: number } | null>(null);

  const CANVAS_WIDTH = 1080;
  const CANVAS_HEIGHT = 1920;

  // Selected layer
  const selectedLayer = scene.layers.find((l) => l.id === selectedLayerId);

  // Auto-fit scale calculator
  useEffect(() => {
    const updateScale = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const availWidth = rect.width - 32;
      const availHeight = rect.height - 32;

      if (zoomLevel === 'fit') {
        const scaleX = availWidth / CANVAS_WIDTH;
        const scaleY = availHeight / CANVAS_HEIGHT;
        const calculated = Math.min(scaleX, scaleY);
        setScale(Math.max(0.15, Math.min(0.85, calculated)));
      } else if (zoomLevel === '50') {
        setScale(0.5);
      } else if (zoomLevel === '75') {
        setScale(0.75);
      } else if (zoomLevel === '100') {
        setScale(1.0);
      }
    };

    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, [zoomLevel]);

  // Deterministic Canvas Render
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    renderScene(ctx, scene, playheadMs, CANVAS_WIDTH, CANVAS_HEIGHT, globalImageCache);
  }, [scene, playheadMs]);

  // Coordinate conversion helper: client coordinate -> canvas 1080x1920 coordinate
  const getCanvasCoords = useCallback(
    (clientX: number, clientY: number) => {
      if (!canvasRef.current) return { x: 0, y: 0 };
      const rect = canvasRef.current.getBoundingClientRect();
      const clientDeltaX = clientX - rect.left;
      const clientDeltaY = clientY - rect.top;

      const normX = clientDeltaX / rect.width;
      const normY = clientDeltaY / rect.height;

      return {
        x: Math.round(normX * CANVAS_WIDTH),
        y: Math.round(normY * CANVAS_HEIGHT),
      };
    },
    [CANVAS_WIDTH, CANVAS_HEIGHT]
  );

  // Pointer Down on Canvas
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const { x, y } = getCanvasCoords(e.clientX, e.clientY);

    // If there is an active selected layer, check if we clicked on resize handles
    if (selectedLayer && !selectedLayer.locked) {
      const handleSize = 36;
      const lx = selectedLayer.x;
      const ly = selectedLayer.y;
      const lw = selectedLayer.w;
      const lh = selectedLayer.h;

      // Handle hit test
      if (Math.abs(x - lx) < handleSize && Math.abs(y - ly) < handleSize) {
        setDragMode('nw');
        setDragStart({ x, y });
        setInitialLayerRect({ x: lx, y: ly, w: lw, h: lh });
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
        return;
      }
      if (Math.abs(x - (lx + lw)) < handleSize && Math.abs(y - ly) < handleSize) {
        setDragMode('ne');
        setDragStart({ x, y });
        setInitialLayerRect({ x: lx, y: ly, w: lw, h: lh });
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
        return;
      }
      if (Math.abs(x - (lx + lw)) < handleSize && Math.abs(y - (ly + lh)) < handleSize) {
        setDragMode('se');
        setDragStart({ x, y });
        setInitialLayerRect({ x: lx, y: ly, w: lw, h: lh });
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
        return;
      }
      if (Math.abs(x - lx) < handleSize && Math.abs(y - (ly + lh)) < handleSize) {
        setDragMode('sw');
        setDragStart({ x, y });
        setInitialLayerRect({ x: lx, y: ly, w: lw, h: lh });
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
        return;
      }

      // Check if inside selected layer body
      if (x >= lx && x <= lx + lw && y >= ly && y <= ly + lh) {
        setDragMode('move');
        setDragStart({ x, y });
        setInitialLayerRect({ x: lx, y: ly, w: lw, h: lh });
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
        return;
      }
    }

    // Otherwise, hit test all layers in reverse order (top to bottom)
    const reversed = [...scene.layers].reverse();
    const hit = reversed.find((l) => {
      if (l.hidden) return false;
      return x >= l.x && x <= l.x + l.w && y >= l.y && y <= l.y + l.h;
    });

    if (hit) {
      onSelectLayer(hit.id);
      if (!hit.locked) {
        setDragMode('move');
        setDragStart({ x, y });
        setInitialLayerRect({ x: hit.x, y: hit.y, w: hit.w, h: hit.h });
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
      }
    } else {
      onSelectLayer(null);
    }
  };

  // Pointer Move
  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragMode || !dragStart || !initialLayerRect || !selectedLayer) return;

    const { x, y } = getCanvasCoords(e.clientX, e.clientY);
    const dx = x - dragStart.x;
    const dy = y - dragStart.y;

    if (dragMode === 'move') {
      onUpdateLayer(selectedLayer.id, {
        x: Math.round(initialLayerRect.x + dx),
        y: Math.round(initialLayerRect.y + dy),
      });
    } else if (dragMode === 'se') {
      onUpdateLayer(selectedLayer.id, {
        w: Math.max(40, Math.round(initialLayerRect.w + dx)),
        h: Math.max(30, Math.round(initialLayerRect.h + dy)),
      });
    } else if (dragMode === 'sw') {
      const newW = Math.max(40, Math.round(initialLayerRect.w - dx));
      const newX = Math.round(initialLayerRect.x + (initialLayerRect.w - newW));
      onUpdateLayer(selectedLayer.id, {
        x: newX,
        w: newW,
        h: Math.max(30, Math.round(initialLayerRect.h + dy)),
      });
    } else if (dragMode === 'ne') {
      const newH = Math.max(30, Math.round(initialLayerRect.h - dy));
      const newY = Math.round(initialLayerRect.y + (initialLayerRect.h - newH));
      onUpdateLayer(selectedLayer.id, {
        y: newY,
        w: Math.max(40, Math.round(initialLayerRect.w + dx)),
        h: newH,
      });
    } else if (dragMode === 'nw') {
      const newW = Math.max(40, Math.round(initialLayerRect.w - dx));
      const newH = Math.max(30, Math.round(initialLayerRect.h - dy));
      const newX = Math.round(initialLayerRect.x + (initialLayerRect.w - newW));
      const newY = Math.round(initialLayerRect.y + (initialLayerRect.h - newH));
      onUpdateLayer(selectedLayer.id, {
        x: newX,
        y: newY,
        w: newW,
        h: newH,
      });
    }
  };

  // Pointer Up
  const handlePointerUp = () => {
    setDragMode(null);
    setDragStart(null);
    setInitialLayerRect(null);
  };

  // Formatted Time helper
  const formatTime = (ms: number) => {
    const totalSeconds = ms / 1000;
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = Math.floor(totalSeconds % 60);
    const millis = Math.floor(ms % 1000);
    return `${minutes.toString().padStart(2, '0')}:${seconds
      .toString()
      .padStart(2, '0')}.${millis.toString().padStart(3, '0')}`;
  };

  return (
    <div className="flex-1 flex flex-col bg-[#0B0B10] overflow-hidden select-none">
      {/* Top Controls Bar: Zoom, Aspect, Add-Layer buttons */}
      <div className="h-10 bg-[#12131C] border-b border-white/10 px-4 flex items-center justify-between gap-4 shrink-0 text-xs text-slate-300">
        {/* Quick Add Layer Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-1">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mr-1">
            Add Layer:
          </span>
          <button
            onClick={() => onAddLayer('text')}
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-white/5 hover:bg-white/10 text-white font-medium transition-colors cursor-pointer"
          >
            <Type className="w-3.5 h-3.5 text-[#FFD54F]" />
            <span>Text</span>
          </button>
          <button
            onClick={() => onAddLayer('code')}
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-white/5 hover:bg-white/10 text-white font-medium transition-colors cursor-pointer"
          >
            <Code2 className="w-3.5 h-3.5 text-[#FFD54F]" />
            <span>Code</span>
          </button>
          <button
            onClick={() => onAddLayer('card')}
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-white/5 hover:bg-white/10 text-white font-medium transition-colors cursor-pointer"
          >
            <Square className="w-3.5 h-3.5 text-[#FFD54F]" />
            <span>Card</span>
          </button>
          <button
            onClick={() => onAddLayer('image')}
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-white/5 hover:bg-white/10 text-white font-medium transition-colors cursor-pointer"
          >
            <ImageIcon className="w-3.5 h-3.5 text-[#FFD54F]" />
            <span>Image</span>
          </button>
          <button
            onClick={() => onAddLayer('highlight')}
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-white/5 hover:bg-white/10 text-white font-medium transition-colors cursor-pointer"
          >
            <Highlighter className="w-3.5 h-3.5 text-[#FFD54F]" />
            <span>Highlight</span>
          </button>
        </div>

        {/* Zoom Selector */}
        <div className="flex items-center gap-1.5 shrink-0">
          <ZoomIn className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={zoomLevel}
            onChange={(e) => setZoomLevel(e.target.value as any)}
            className="bg-white/5 border border-white/10 rounded px-2 py-0.5 text-[11px] text-white focus:outline-none"
          >
            <option value="fit">Fit ({Math.round(scale * 100)}%)</option>
            <option value="50">50%</option>
            <option value="75">75%</option>
            <option value="100">100% (1080p)</option>
          </select>
        </div>
      </div>

      {/* Center Canvas Viewport */}
      <div
        ref={containerRef}
        className="flex-1 relative overflow-auto flex items-center justify-center p-4 bg-[#08080C]"
      >
        {/* Canvas Phone Mockup Container */}
        <div
          className="relative rounded-2xl shadow-2xl shadow-black border border-white/15 overflow-hidden transition-transform duration-75 select-none"
          style={{
            width: CANVAS_WIDTH * scale,
            height: CANVAS_HEIGHT * scale,
          }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
        >
          {/* Main 1080x1920 Canvas */}
          <canvas
            ref={canvasRef}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            className="w-full h-full block cursor-crosshair"
          />

          {/* Interactive Bounding Box Overlay for Selected Layer */}
          {selectedLayer && !selectedLayer.hidden && (
            <div
              className="absolute pointer-events-none border-2 border-[#FFD54F] shadow-lg shadow-[#FFD54F]/20"
              style={{
                left: selectedLayer.x * scale,
                top: selectedLayer.y * scale,
                width: selectedLayer.w * scale,
                height: selectedLayer.h * scale,
              }}
            >
              {/* Coordinates & Layer Tag HUD */}
              <div className="absolute -top-6 left-0 bg-[#FFD54F] text-[#0B0B10] px-1.5 py-0.5 rounded text-[10px] font-mono font-bold tracking-tight whitespace-nowrap flex items-center gap-1">
                <span>{selectedLayer.type}</span>
                <span>·</span>
                <span>
                  {Math.round(selectedLayer.x)}, {Math.round(selectedLayer.y)}
                </span>
                <span>({Math.round(selectedLayer.w)}×{Math.round(selectedLayer.h)})</span>
              </div>

              {/* 4 Corner Resize Handles */}
              {!selectedLayer.locked && (
                <>
                  <div className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-white border border-[#0B0B10] rounded-sm pointer-events-auto cursor-nwse-resize" />
                  <div className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-white border border-[#0B0B10] rounded-sm pointer-events-auto cursor-nesw-resize" />
                  <div className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-white border border-[#0B0B10] rounded-sm pointer-events-auto cursor-nwse-resize" />
                  <div className="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-white border border-[#0B0B10] rounded-sm pointer-events-auto cursor-nesw-resize" />
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Floating Canvas Playback Controls Bar */}
      <div className="h-12 bg-[#12131D] border-t border-white/10 px-6 flex items-center justify-between gap-4 shrink-0">
        {/* Play/Pause & Reset */}
        <div className="flex items-center gap-2">
          <button
            onClick={onTogglePlay}
            title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
            className="w-8 h-8 rounded-lg bg-[#FFD54F] hover:bg-[#FFE082] text-[#0B0B10] flex items-center justify-center transition-transform active:scale-90 cursor-pointer shadow-sm shadow-[#FFD54F]/20"
          >
            {isPlaying ? (
              <Pause className="w-4 h-4 fill-current stroke-none" />
            ) : (
              <Play className="w-4 h-4 fill-current stroke-none ml-0.5" />
            )}
          </button>

          <button
            onClick={() => onPlayheadChange(0)}
            title="Rewind to Start"
            className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={onToggleLoop}
            title={isLooping ? 'Loop Enabled' : 'Loop Disabled'}
            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors cursor-pointer ${
              isLooping
                ? 'bg-[#FFD54F]/20 text-[#FFD54F] border border-[#FFD54F]/30'
                : 'bg-white/5 text-slate-400 hover:text-white'
            }`}
          >
            <Repeat className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Scrubber / Slider */}
        <div className="flex-1 max-w-xl flex items-center gap-3">
          <input
            type="range"
            min="0"
            max={scene.durationMs}
            step="10"
            value={playheadMs}
            onChange={(e) => onPlayheadChange(parseFloat(e.target.value))}
            className="w-full h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-[#FFD54F]"
          />
        </div>

        {/* Time Display with Tabular Numerals */}
        <div className="font-mono text-xs text-white tabular-nums tracking-wide flex items-center gap-1">
          <span className="text-[#FFD54F] font-bold">{formatTime(playheadMs)}</span>
          <span className="text-slate-500">/</span>
          <span className="text-slate-400">{formatTime(scene.durationMs)}</span>
        </div>
      </div>
    </div>
  );
};

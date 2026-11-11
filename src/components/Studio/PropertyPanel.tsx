/**
 * Studio Property Panel
 * 5 Tabs: Content, Transform, Style, Animation, Layer
 * Full controls for the selected layer.
 */

import React, { useState } from 'react';
import { Layer, LayerType, EffectId, EasingId, SpringProfile } from '../../types';
import { EFFECTS_CATALOG } from '../../engine/effects';
import {
  AlignLeft,
  AlignCenter,
  AlignRight,
  Copy,
  Trash2,
  ArrowUp,
  ArrowDown,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  Upload,
  Sparkles,
  Sliders,
  Paintbrush,
  Move,
  Layers,
  FileCode,
} from 'lucide-react';

interface PropertyPanelProps {
  layer: Layer | null;
  onUpdateLayer: (layerId: string, updates: Partial<Layer>) => void;
  onDuplicateLayer: (layerId: string) => void;
  onDeleteLayer: (layerId: string) => void;
  onMoveLayerUp: (layerId: string) => void;
  onMoveLayerDown: (layerId: string) => void;
}

type TabType = 'content' | 'transform' | 'style' | 'animation' | 'layer';

const COLOR_PRESETS = [
  '#FFFFFF',
  '#FFD54F', // signature yellow
  '#4ADE80', // green
  '#38BDF8', // sky blue
  '#F87171', // coral red
  '#C084FC', // purple
  '#FB923C', // orange
  '#94A3B8', // muted slate
];

const BG_PRESETS = [
  '#00000000', // transparent
  '#141520', // dark card
  '#11121B', // code dark
  '#FFD54F33', // yellow translucent
  '#38BDF833', // cyan translucent
  '#4ADE8033', // emerald translucent
  '#F8717133', // red translucent
  '#0B0B10', // deepest black
];

const EASING_OPTIONS: EasingId[] = [
  'linear',
  'sine.in',
  'sine.out',
  'sine.inOut',
  'power1.in',
  'power1.out',
  'power1.inOut',
  'power2.in',
  'power2.out',
  'power2.inOut',
  'power3.in',
  'power3.out',
  'power3.inOut',
  'power4.in',
  'power4.out',
  'power4.inOut',
  'expo.in',
  'expo.out',
  'expo.inOut',
  'circ.in',
  'circ.out',
  'circ.inOut',
  'back.in',
  'back.out',
  'back.inOut',
  'elastic.in',
  'elastic.out',
  'elastic.inOut',
  'bounce.in',
  'bounce.out',
  'bounce.inOut',
];

export const PropertyPanel: React.FC<PropertyPanelProps> = ({
  layer,
  onUpdateLayer,
  onDuplicateLayer,
  onDeleteLayer,
  onMoveLayerUp,
  onMoveLayerDown,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('content');

  if (!layer) {
    return (
      <div className="w-80 bg-[#12131C] border-l border-white/10 flex flex-col items-center justify-center p-6 text-center text-slate-500 shrink-0">
        <Sliders className="w-8 h-8 stroke-1 text-slate-600 mb-2" />
        <p className="text-xs font-semibold text-slate-400">No Layer Selected</p>
        <p className="text-[11px] text-slate-500 mt-1">
          Click any layer on the canvas or timeline to inspect and edit properties.
        </p>
      </div>
    );
  }

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const objUrl = URL.createObjectURL(file);
      onUpdateLayer(layer.id, { imageUrl: objUrl });
    }
  };

  return (
    <div className="w-80 bg-[#12131C] border-l border-white/10 flex flex-col shrink-0 overflow-hidden select-none">
      {/* Property Panel Tabs Header */}
      <div className="h-10 bg-[#141522] border-b border-white/10 px-2 flex items-center justify-between gap-1 shrink-0">
        <button
          onClick={() => setActiveTab('content')}
          className={`flex-1 py-1.5 text-[11px] font-semibold rounded transition-colors ${
            activeTab === 'content'
              ? 'bg-white/10 text-white'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Content
        </button>
        <button
          onClick={() => setActiveTab('transform')}
          className={`flex-1 py-1.5 text-[11px] font-semibold rounded transition-colors ${
            activeTab === 'transform'
              ? 'bg-white/10 text-white'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Transform
        </button>
        <button
          onClick={() => setActiveTab('style')}
          className={`flex-1 py-1.5 text-[11px] font-semibold rounded transition-colors ${
            activeTab === 'style'
              ? 'bg-white/10 text-white'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Style
        </button>
        <button
          onClick={() => setActiveTab('animation')}
          className={`flex-1 py-1.5 text-[11px] font-semibold rounded transition-colors ${
            activeTab === 'animation'
              ? 'bg-white/10 text-[#FFD54F]'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Anim
        </button>
        <button
          onClick={() => setActiveTab('layer')}
          className={`flex-1 py-1.5 text-[11px] font-semibold rounded transition-colors ${
            activeTab === 'layer'
              ? 'bg-white/10 text-white'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Layer
        </button>
      </div>

      {/* Panel Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5 text-xs text-slate-300">
        {/* ==================== TAB 1: CONTENT ==================== */}
        {activeTab === 'content' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-white uppercase text-[10px] tracking-wider">
                {layer.type} Content
              </span>
              <span className="text-[10px] font-mono text-[#FFD54F] px-1.5 py-0.5 rounded bg-white/5">
                {layer.effect}
              </span>
            </div>

            {/* Text Layer / Card Layer Content */}
            {(layer.type === 'text' || layer.type === 'card' || layer.type === 'highlight') && (
              <div className="space-y-1.5">
                <label className="text-[11px] font-medium text-slate-400">Layer Text</label>
                <textarea
                  rows={3}
                  value={layer.text || ''}
                  onChange={(e) => onUpdateLayer(layer.id, { text: e.target.value })}
                  placeholder="Enter display text..."
                  className="w-full p-2.5 bg-black/40 border border-white/10 rounded-lg text-xs text-white placeholder-slate-600 focus:outline-none focus:border-[#FFD54F]"
                />

                {/* Text Alignment */}
                <div className="flex items-center justify-between pt-2">
                  <span className="text-[11px] font-medium text-slate-400">Align</span>
                  <div className="flex items-center gap-1 bg-white/5 p-0.5 rounded-lg border border-white/10">
                    <button
                      onClick={() => onUpdateLayer(layer.id, { textAlign: 'left' })}
                      className={`p-1.5 rounded ${
                        layer.textAlign === 'left' ? 'bg-[#FFD54F] text-[#0B0B10]' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <AlignLeft className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onUpdateLayer(layer.id, { textAlign: 'center' })}
                      className={`p-1.5 rounded ${
                        layer.textAlign === 'center' || !layer.textAlign
                          ? 'bg-[#FFD54F] text-[#0B0B10]'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <AlignCenter className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onUpdateLayer(layer.id, { textAlign: 'right' })}
                      className={`p-1.5 rounded ${
                        layer.textAlign === 'right' ? 'bg-[#FFD54F] text-[#0B0B10]' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <AlignRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Code Layer Content */}
            {layer.type === 'code' && (
              <div className="space-y-3">
                <div>
                  <label className="text-[11px] font-medium text-slate-400">Code Snippet</label>
                  <textarea
                    rows={6}
                    value={layer.code || layer.text || ''}
                    onChange={(e) => onUpdateLayer(layer.id, { code: e.target.value })}
                    placeholder="Enter code here..."
                    className="w-full p-2.5 bg-black/40 border border-white/10 rounded-lg font-mono text-[11px] text-emerald-400 placeholder-slate-600 focus:outline-none focus:border-[#FFD54F] leading-relaxed"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-medium text-slate-400">
                    Target Highlight Line
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={layer.highlightLine || 2}
                    onChange={(e) =>
                      onUpdateLayer(layer.id, { highlightLine: parseInt(e.target.value) || 1 })
                    }
                    className="w-full px-2.5 py-1.5 bg-black/40 border border-white/10 rounded-lg font-mono text-xs text-white"
                  />
                </div>
              </div>
            )}

            {/* Image Layer Content */}
            {layer.type === 'image' && (
              <div className="space-y-3">
                <label className="text-[11px] font-medium text-slate-400">Image Source</label>
                {layer.imageUrl && (
                  <div className="w-full h-32 rounded-lg border border-white/10 overflow-hidden bg-black/40 flex items-center justify-center">
                    <img
                      src={layer.imageUrl}
                      alt="Layer preview"
                      className="w-full h-full object-contain"
                    />
                  </div>
                )}

                <label className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg border border-dashed border-white/20 hover:border-[#FFD54F] bg-white/5 hover:bg-white/10 cursor-pointer text-xs text-white transition-colors">
                  <Upload className="w-3.5 h-3.5 text-[#FFD54F]" />
                  <span>{layer.imageUrl ? 'Replace Image File' : 'Upload Image File'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageFileChange}
                    className="hidden"
                  />
                </label>
              </div>
            )}
          </div>
        )}

        {/* ==================== TAB 2: TRANSFORM ==================== */}
        {activeTab === 'transform' && (
          <div className="space-y-4">
            <span className="font-semibold text-white uppercase text-[10px] tracking-wider block">
              Position & Dimensions
            </span>

            {/* X Position */}
            <div>
              <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                <span>X Position</span>
                <span className="font-mono text-white">{Math.round(layer.x)} px</span>
              </div>
              <input
                type="range"
                min="0"
                max="1080"
                value={layer.x}
                onChange={(e) => onUpdateLayer(layer.id, { x: parseInt(e.target.value) })}
                className="w-full accent-[#FFD54F]"
              />
            </div>

            {/* Y Position */}
            <div>
              <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                <span>Y Position</span>
                <span className="font-mono text-white">{Math.round(layer.y)} px</span>
              </div>
              <input
                type="range"
                min="0"
                max="1920"
                value={layer.y}
                onChange={(e) => onUpdateLayer(layer.id, { y: parseInt(e.target.value) })}
                className="w-full accent-[#FFD54F]"
              />
            </div>

            {/* Width */}
            <div>
              <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                <span>Width</span>
                <span className="font-mono text-white">{Math.round(layer.w)} px</span>
              </div>
              <input
                type="range"
                min="40"
                max="1080"
                value={layer.w}
                onChange={(e) => onUpdateLayer(layer.id, { w: parseInt(e.target.value) })}
                className="w-full accent-[#FFD54F]"
              />
            </div>

            {/* Height */}
            <div>
              <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                <span>Height</span>
                <span className="font-mono text-white">{Math.round(layer.h)} px</span>
              </div>
              <input
                type="range"
                min="20"
                max="1920"
                value={layer.h}
                onChange={(e) => onUpdateLayer(layer.id, { h: parseInt(e.target.value) })}
                className="w-full accent-[#FFD54F]"
              />
            </div>

            {/* Opacity */}
            <div>
              <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                <span>Opacity</span>
                <span className="font-mono text-white">
                  {Math.round((layer.opacity ?? 1) * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={Math.round((layer.opacity ?? 1) * 100)}
                onChange={(e) => onUpdateLayer(layer.id, { opacity: parseInt(e.target.value) / 100 })}
                className="w-full accent-[#FFD54F]"
              />
            </div>

            {/* Rotation */}
            <div>
              <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                <span>Rotation</span>
                <span className="font-mono text-white">{layer.rotation || 0}°</span>
              </div>
              <input
                type="range"
                min="-180"
                max="180"
                value={layer.rotation || 0}
                onChange={(e) => onUpdateLayer(layer.id, { rotation: parseInt(e.target.value) })}
                className="w-full accent-[#FFD54F]"
              />
            </div>

            {/* Alignment Quick Actions */}
            <div className="pt-2 border-t border-white/10 flex gap-2">
              <button
                onClick={() => onUpdateLayer(layer.id, { x: Math.round((1080 - layer.w) / 2) })}
                className="flex-1 py-1.5 bg-white/5 hover:bg-white/10 rounded text-[11px] font-medium text-white transition-colors"
              >
                Center Horiz
              </button>
              <button
                onClick={() => onUpdateLayer(layer.id, { y: Math.round((1920 - layer.h) / 2) })}
                className="flex-1 py-1.5 bg-white/5 hover:bg-white/10 rounded text-[11px] font-medium text-white transition-colors"
              >
                Center Vert
              </button>
            </div>
          </div>
        )}

        {/* ==================== TAB 3: STYLE ==================== */}
        {activeTab === 'style' && (
          <div className="space-y-4">
            <span className="font-semibold text-white uppercase text-[10px] tracking-wider block">
              Colors & Typography
            </span>

            {/* Font Size */}
            <div>
              <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                <span>Font Size</span>
                <span className="font-mono text-white">{layer.fontSize || 54} px</span>
              </div>
              <input
                type="range"
                min="16"
                max="140"
                value={layer.fontSize || 54}
                onChange={(e) => onUpdateLayer(layer.id, { fontSize: parseInt(e.target.value) })}
                className="w-full accent-[#FFD54F]"
              />
            </div>

            {/* Text Color Presets */}
            <div>
              <label className="text-[11px] font-medium text-slate-400 block mb-1.5">
                Accent / Text Color
              </label>
              <div className="flex items-center gap-1.5 flex-wrap">
                {COLOR_PRESETS.map((c) => (
                  <button
                    key={c}
                    onClick={() => onUpdateLayer(layer.id, { color: c })}
                    style={{ backgroundColor: c }}
                    className={`w-6 h-6 rounded-full border transition-transform cursor-pointer ${
                      layer.color === c ? 'border-white scale-110 shadow-md' : 'border-white/20'
                    }`}
                  />
                ))}
                <input
                  type="color"
                  value={layer.color || '#FFFFFF'}
                  onChange={(e) => onUpdateLayer(layer.id, { color: e.target.value })}
                  className="w-6 h-6 rounded-full border border-white/20 cursor-pointer bg-transparent p-0"
                />
              </div>
            </div>

            {/* Background Color Presets */}
            <div>
              <label className="text-[11px] font-medium text-slate-400 block mb-1.5">
                Background Surface
              </label>
              <div className="flex items-center gap-1.5 flex-wrap">
                {BG_PRESETS.map((bg) => (
                  <button
                    key={bg}
                    onClick={() => onUpdateLayer(layer.id, { bg })}
                    style={{ backgroundColor: bg === '#00000000' ? 'transparent' : bg }}
                    title={bg === '#00000000' ? 'Transparent' : bg}
                    className={`w-6 h-6 rounded-lg border transition-transform cursor-pointer relative ${
                      layer.bg === bg ? 'border-[#FFD54F] scale-110' : 'border-white/20'
                    }`}
                  >
                    {bg === '#00000000' && (
                      <span className="absolute inset-0 flex items-center justify-center text-[10px] text-slate-500">
                        ∅
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Border Radius */}
            <div>
              <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                <span>Corner Radius</span>
                <span className="font-mono text-white">{layer.borderRadius || 12} px</span>
              </div>
              <input
                type="range"
                min="0"
                max="60"
                value={layer.borderRadius || 12}
                onChange={(e) => onUpdateLayer(layer.id, { borderRadius: parseInt(e.target.value) })}
                className="w-full accent-[#FFD54F]"
              />
            </div>
          </div>
        )}

        {/* ==================== TAB 4: ANIMATION ==================== */}
        {activeTab === 'animation' && (
          <div className="space-y-4">
            <span className="font-semibold text-[#FFD54F] uppercase text-[10px] tracking-wider block flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              Motion Curves & Easing
            </span>

            {/* Effect Dropdown grouped by category */}
            <div>
              <label className="text-[11px] font-medium text-slate-400 block mb-1">
                Effect (26 Catalog IDs)
              </label>
              <select
                value={layer.effect}
                onChange={(e) => onUpdateLayer(layer.id, { effect: e.target.value as EffectId })}
                className="w-full px-2.5 py-1.5 bg-black/50 border border-white/10 rounded-lg text-xs font-mono text-white focus:outline-none focus:border-[#FFD54F]"
              >
                <optgroup label="Entrance & Impact">
                  <option value="pop-in">pop-in</option>
                  <option value="slide-up">slide-up</option>
                  <option value="bounce-drop">bounce-drop</option>
                  <option value="elastic-snap">elastic-snap</option>
                  <option value="whoosh">whoosh</option>
                  <option value="fade">fade</option>
                  <option value="impact-shake">impact-shake</option>
                </optgroup>
                <optgroup label="Text & Typing">
                  <option value="typewriter">typewriter</option>
                  <option value="word-reveal">word-reveal</option>
                  <option value="char-stagger-in">char-stagger-in</option>
                  <option value="counter-up">counter-up</option>
                  <option value="code-typewriter">code-typewriter</option>
                </optgroup>
                <optgroup label="Markers & Highlights">
                  <option value="highlight-sweep">highlight-sweep</option>
                  <option value="underline-draw">underline-draw</option>
                  <option value="circle-marker">circle-marker</option>
                  <option value="box-marker">box-marker</option>
                  <option value="draw-arrow">draw-arrow</option>
                  <option value="path-arrow">path-arrow</option>
                </optgroup>
                <optgroup label="Dynamic & Camera">
                  <option value="line-highlight">line-highlight</option>
                  <option value="zoom-to-line">zoom-to-line</option>
                  <option value="slide-card">slide-card</option>
                  <option value="flip-in">flip-in</option>
                  <option value="push-in">push-in</option>
                  <option value="pan">pan</option>
                </optgroup>
                <optgroup label="Continuous & Pulse">
                  <option value="keyword-pulse">keyword-pulse</option>
                  <option value="glow-pulse">glow-pulse</option>
                </optgroup>
              </select>
            </div>

            {/* GSAP Easing Dropdown */}
            <div>
              <label className="text-[11px] font-medium text-slate-400 block mb-1">
                GSAP Easing Function
              </label>
              <select
                value={layer.easing || 'power2.out'}
                onChange={(e) => onUpdateLayer(layer.id, { easing: e.target.value as EasingId })}
                className="w-full px-2.5 py-1.5 bg-black/50 border border-white/10 rounded-lg text-xs font-mono text-white focus:outline-none focus:border-[#FFD54F]"
              >
                {EASING_OPTIONS.map((ease) => (
                  <option key={ease} value={ease}>
                    {ease}
                  </option>
                ))}
              </select>
            </div>

            {/* Spring Profile Selector */}
            <div>
              <label className="text-[11px] font-medium text-slate-400 block mb-1">
                Spring Profile (Damped Oscillator)
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {(['smooth', 'snappy', 'bouncy'] as SpringProfile[]).map((sp) => (
                  <button
                    key={sp}
                    onClick={() => onUpdateLayer(layer.id, { spring: sp })}
                    className={`py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${
                      layer.spring === sp
                        ? 'bg-[#FFD54F] text-[#0B0B10] font-bold'
                        : 'bg-white/5 text-slate-400 hover:text-white'
                    }`}
                  >
                    {sp}
                  </button>
                ))}
              </div>
            </div>

            {/* Timing: startMs & durationMs */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-medium text-slate-400 block mb-1">
                  Start (ms)
                </label>
                <input
                  type="number"
                  step="50"
                  min="0"
                  value={layer.startMs}
                  onChange={(e) =>
                    onUpdateLayer(layer.id, { startMs: Math.max(0, parseInt(e.target.value) || 0) })
                  }
                  className="w-full px-2.5 py-1.5 bg-black/40 border border-white/10 rounded-lg font-mono text-xs text-white"
                />
              </div>

              <div>
                <label className="text-[11px] font-medium text-slate-400 block mb-1">
                  Duration (ms)
                </label>
                <input
                  type="number"
                  step="50"
                  min="50"
                  value={layer.durationMs}
                  onChange={(e) =>
                    onUpdateLayer(layer.id, {
                      durationMs: Math.max(50, parseInt(e.target.value) || 100),
                    })
                  }
                  className="w-full px-2.5 py-1.5 bg-black/40 border border-white/10 rounded-lg font-mono text-xs text-white"
                />
              </div>
            </div>

            {/* Stagger (ms) */}
            <div>
              <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                <span>Stagger per unit</span>
                <span className="font-mono text-white">{layer.stagger || 0} ms</span>
              </div>
              <input
                type="range"
                min="0"
                max="200"
                step="5"
                value={layer.stagger || 0}
                onChange={(e) => onUpdateLayer(layer.id, { stagger: parseInt(e.target.value) })}
                className="w-full accent-[#FFD54F]"
              />
            </div>
          </div>
        )}

        {/* ==================== TAB 5: LAYER OPERATIONS ==================== */}
        {activeTab === 'layer' && (
          <div className="space-y-4">
            <span className="font-semibold text-white uppercase text-[10px] tracking-wider block">
              Stack & Organization
            </span>

            {/* Z-Order Buttons */}
            <div className="space-y-2">
              <label className="text-[11px] font-medium text-slate-400 block">Z-Order (Hierarchy)</label>
              <div className="flex gap-2">
                <button
                  onClick={() => onMoveLayerUp(layer.id)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-xs font-medium text-white transition-colors"
                >
                  <ArrowUp className="w-3.5 h-3.5 text-[#FFD54F]" />
                  <span>Bring Forward</span>
                </button>
                <button
                  onClick={() => onMoveLayerDown(layer.id)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-xs font-medium text-white transition-colors"
                >
                  <ArrowDown className="w-3.5 h-3.5 text-[#FFD54F]" />
                  <span>Send Backward</span>
                </button>
              </div>
            </div>

            {/* Visibility & Lock Toggles */}
            <div className="pt-2 border-t border-white/10 space-y-2">
              <label className="text-[11px] font-medium text-slate-400 block">State</label>
              <div className="flex gap-2">
                <button
                  onClick={() => onUpdateLayer(layer.id, { hidden: !layer.hidden })}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-colors ${
                    layer.hidden
                      ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                      : 'bg-white/5 text-slate-300 hover:text-white'
                  }`}
                >
                  {layer.hidden ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  <span>{layer.hidden ? 'Hidden' : 'Visible'}</span>
                </button>

                <button
                  onClick={() => onUpdateLayer(layer.id, { locked: !layer.locked })}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-colors ${
                    layer.locked
                      ? 'bg-[#FFD54F]/20 text-[#FFD54F] border border-[#FFD54F]/30'
                      : 'bg-white/5 text-slate-300 hover:text-white'
                  }`}
                >
                  {layer.locked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                  <span>{layer.locked ? 'Locked' : 'Unlocked'}</span>
                </button>
              </div>
            </div>

            {/* Duplicate & Delete Actions */}
            <div className="pt-4 border-t border-white/10 space-y-2">
              <button
                onClick={() => onDuplicateLayer(layer.id)}
                className="w-full flex items-center justify-center gap-2 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-xs font-medium text-white transition-colors cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5 text-slate-400" />
                <span>Duplicate Layer</span>
              </button>

              <button
                onClick={() => onDeleteLayer(layer.id)}
                className="w-full flex items-center justify-center gap-2 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg text-xs font-medium transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Layer</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

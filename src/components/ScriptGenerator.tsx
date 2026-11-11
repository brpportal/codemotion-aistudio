/**
 * New Script Generator Screen
 * Generates downloadable and copyable script.md in the required specification format.
 */

import React, { useState } from 'react';
import { EffectId, Project } from '../types';
import { EFFECTS_CATALOG } from '../engine/effects';
import { FileDown, Copy, Check, Sparkles, Film, ArrowRight } from 'lucide-react';

interface ScriptGeneratorProps {
  selectedEffects: Set<EffectId>;
  onToggleEffect: (id: EffectId) => void;
  onLoadProject: (project: Project) => void;
  onNavigateToStudio: () => void;
}

export const ScriptGenerator: React.FC<ScriptGeneratorProps> = ({
  selectedEffects,
  onToggleEffect,
  onLoadProject,
  onNavigateToStudio,
}) => {
  const [title, setTitle] = useState('Why Your Animations Feel Clunky');
  const [contentType, setContentType] = useState('Tech Hook & Solution');
  const [canvasSize, setCanvasSize] = useState('1080x1920 (9:16) @ 30fps');
  const [content, setContent] = useState(
`Hook: Stop using linear easing for your UI animations.
Scene 1: 99% of developers use linear or simple ease-in-out curves. It looks robotic and lifeless.
Scene 2: Physics-based damped spring oscillators mirror real world mass and momentum.
Code Demo: import { spring } from "codemotion" with stiffness 280 and damping 18.
Punchline: Smooth, snappy, and bouncy physics elevate user interfaces instantly.`
  );

  const [copied, setCopied] = useState(false);

  // Compute selected effects array (or fall back to recommended effects if none selected)
  const effectiveEffects: EffectId[] =
    selectedEffects.size > 0
      ? Array.from(selectedEffects)
      : ['pop-in', 'bounce-drop', 'elastic-snap', 'code-typewriter', 'circle-marker', 'underline-draw'];

  // Generate the exact markdown required by the specification
  const generatedScriptMarkdown = `# CodeMotion Script — ${title.trim() || 'Untitled Script'}

## Repository
brpportal/codemotion

## Canvas
${canvasSize}

## Target Effects
${effectiveEffects.map((eff) => `- ${eff}`).join('\n')}

## Content Type
${contentType}

## Content
${content.trim()}

## Instructions
Return only a project.json using the catalog effect IDs.
No scene static over 3s.
First scene must be a hook.
All timings in ms.
2-6 words per layer.
High-contrast colors.
`;

  const handleDownload = () => {
    const blob = new Blob([generatedScriptMarkdown], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const sanitizedTitle = (title || 'codemotion_script').toLowerCase().replace(/[^a-z0-9_-]/g, '_');
    a.download = `script_${sanitizedTitle}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(generatedScriptMarkdown);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy markdown:', err);
    }
  };

  const handleGenerateProjectAndOpen = () => {
    // Generate an instant project draft from this script
    const lines = content.split('\n').filter((l) => l.trim().length > 0);

    const draftProject: Project = {
      id: `proj-${Date.now()}`,
      title: title || 'Generated Motion Project',
      canvas: {
        width: 1080,
        height: 1920,
        fps: 30,
      },
      scenes: [
        {
          id: `scene-hook-${Date.now()}`,
          name: 'Scene 1: Hook',
          durationMs: 3000,
          bg: '#0B0B10',
          layers: [
            {
              id: `l-h1`,
              type: 'text',
              effect: effectiveEffects[0] || 'bounce-drop',
              startMs: 200,
              durationMs: 800,
              x: 90,
              y: 600,
              w: 900,
              h: 120,
              text: (lines[0] || title).toUpperCase().slice(0, 32),
              color: '#FFD54F',
              fontSize: 72,
              textAlign: 'center',
              spring: 'bouncy',
            },
            {
              id: `l-h2`,
              type: 'highlight',
              effect: 'underline-draw',
              startMs: 900,
              durationMs: 600,
              x: 180,
              y: 740,
              w: 720,
              h: 12,
              color: '#FFD54F',
            },
            {
              id: `l-h3`,
              type: 'card',
              effect: 'slide-card',
              startMs: 1400,
              durationMs: 800,
              x: 140,
              y: 860,
              w: 800,
              h: 140,
              text: (lines[1] || 'Stop Using Linear Motion').slice(0, 40),
              color: '#FFFFFF',
              bg: '#141520',
              fontSize: 34,
              borderRadius: 20,
              spring: 'snappy',
            },
          ],
        },
        {
          id: `scene-body-${Date.now()}`,
          name: 'Scene 2: Solution & Code',
          durationMs: 3500,
          bg: '#0B0B10',
          layers: [
            {
              id: `l-b1`,
              type: 'text',
              effect: 'pop-in',
              startMs: 150,
              durationMs: 650,
              x: 90,
              y: 420,
              w: 900,
              h: 80,
              text: 'DAMPED OSCILLATOR',
              color: '#FFD54F',
              fontSize: 60,
              textAlign: 'center',
            },
            {
              id: `l-b2`,
              type: 'code',
              effect: 'code-typewriter',
              startMs: 400,
              durationMs: 1800,
              x: 90,
              y: 540,
              w: 900,
              h: 620,
              code: `import { spring } from "codemotion";\n\nconst physics = spring({\n  stiffness: 240,\n  damping: 16,\n});\n// Smooth natural dynamics`,
              bg: '#11121A',
              fontSize: 34,
              borderRadius: 20,
              highlightLine: 3,
            },
            {
              id: `l-b3`,
              type: 'text',
              effect: 'circle-marker',
              startMs: 2000,
              durationMs: 700,
              x: 220,
              y: 720,
              w: 460,
              h: 110,
              color: '#FFD54F',
            },
          ],
        },
      ],
      updatedAt: Date.now(),
    };

    onLoadProject(draftProject);
    onNavigateToStudio();
  };

  return (
    <div className="flex-1 overflow-y-auto bg-[#0B0B10] p-6 lg:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Title Header */}
        <div className="border-b border-white/10 pb-6">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#FFD54F] tracking-wider uppercase mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            Script Generator (script.md)
          </div>
          <h1 className="text-2xl lg:text-3xl font-extrabold text-white tracking-tight">
            Generate CodeMotion Script
          </h1>
          <p className="text-slate-400 text-sm mt-1 max-w-2xl">
            Configure your video narrative, content type, target effects, and prompt instructions.
            Downloads a standardized <code className="text-[#FFD54F] bg-white/5 px-1 py-0.5 rounded font-mono text-xs">script.md</code> file or initializes a new Project Studio timeline.
          </p>
        </div>

        {/* 2-Column Layout: Form on Left, Live Markdown Preview on Right */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Form Controls (7 cols) */}
          <div className="lg:col-span-7 space-y-5 bg-[#14151F] border border-white/10 rounded-2xl p-6">
            <h2 className="text-base font-bold text-white tracking-tight flex items-center justify-between">
              <span>Script Parameters</span>
              <span className="text-xs text-slate-400 font-normal">
                {effectiveEffects.length} Target Effects
              </span>
            </h2>

            {/* Video Title */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Video Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Why Animations Feel Clunky"
                className="w-full px-3.5 py-2 bg-black/40 border border-white/10 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#FFD54F] transition-colors"
              />
            </div>

            {/* Content Type & Canvas Size Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Content Type
                </label>
                <select
                  value={contentType}
                  onChange={(e) => setContentType(e.target.value)}
                  className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-lg text-xs text-white focus:outline-none focus:border-[#FFD54F] transition-colors"
                >
                  <option value="Tech Hook & Solution">Tech Hook & Solution</option>
                  <option value="Coding Tutorial">Coding Tutorial</option>
                  <option value="Product Teaser">Product Teaser</option>
                  <option value="Code Breakdown">Code Breakdown</option>
                  <option value="Factoid / Metric">Factoid / Metric</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Canvas Resolution & Aspect Ratio
                </label>
                <select
                  value={canvasSize}
                  onChange={(e) => setCanvasSize(e.target.value)}
                  className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-lg text-xs text-white focus:outline-none focus:border-[#FFD54F] transition-colors"
                >
                  <option value="1080x1920 (9:16) @ 30fps">1080x1920 (9:16) @ 30fps — Mobile Portrait</option>
                  <option value="1080x1080 (1:1) @ 30fps">1080x1080 (1:1) @ 30fps — Square</option>
                  <option value="1920x1080 (16:9) @ 30fps">1920x1080 (16:9) @ 30fps — Landscape</option>
                </select>
              </div>
            </div>

            {/* Content Textarea */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Narrative & Outline Content
              </label>
              <textarea
                rows={6}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write scene-by-scene script or hook lines..."
                className="w-full p-3.5 bg-black/40 border border-white/10 rounded-lg text-xs font-mono text-slate-200 placeholder-slate-600 focus:outline-none focus:border-[#FFD54F] transition-colors leading-relaxed"
              />
              <span className="text-[11px] text-slate-500 mt-1 block">
                Aim for 2–6 words per layer with clear high-contrast hierarchy.
              </span>
            </div>

            {/* Target Effects Selector Chips */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">
                Included Target Effects ({effectiveEffects.length} selected)
              </label>
              <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto p-2 bg-black/30 rounded-lg border border-white/5">
                {EFFECTS_CATALOG.map((eff) => {
                  const isChecked = selectedEffects.has(eff.id);
                  return (
                    <button
                      type="button"
                      key={eff.id}
                      onClick={() => onToggleEffect(eff.id)}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-mono transition-colors flex items-center gap-1.5 cursor-pointer ${
                        isChecked
                          ? 'bg-[#FFD54F]/20 text-[#FFD54F] border border-[#FFD54F]/40'
                          : 'bg-white/5 text-slate-400 hover:text-slate-200 border border-white/5'
                      }`}
                    >
                      <span>{eff.id}</span>
                      {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Column: Live Markdown Output & Actions (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-[#14151F] border border-white/10 rounded-2xl p-6 flex flex-col h-full">
              <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
                <span className="font-mono text-xs font-bold text-white flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#FFD54F]" />
                  script.md Preview
                </span>
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 text-xs text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 px-2.5 py-1 rounded-md transition-colors"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>

              {/* Code/Markdown block */}
              <pre className="flex-1 max-h-[460px] overflow-y-auto p-4 bg-black/60 rounded-xl border border-white/5 text-slate-300 font-mono text-[11px] leading-relaxed whitespace-pre-wrap select-all">
                {generatedScriptMarkdown}
              </pre>

              {/* Action Buttons */}
              <div className="mt-5 space-y-2.5 pt-4 border-t border-white/10">
                <button
                  onClick={handleDownload}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold bg-[#FFD54F] text-[#0B0B10] hover:bg-[#FFE082] shadow-md shadow-[#FFD54F]/20 transition-all cursor-pointer active:scale-98"
                >
                  <FileDown className="w-4 h-4" />
                  Download script.md
                </button>

                <button
                  onClick={handleGenerateProjectAndOpen}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/15 text-white border border-white/10 transition-colors cursor-pointer"
                >
                  <Film className="w-4 h-4 text-[#FFD54F]" />
                  Create Project & Open in Studio
                  <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

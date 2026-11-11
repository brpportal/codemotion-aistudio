/**
 * Top Navigation Bar
 * Follows Top Bar Contract: Brand Zone — 4-5 Navigation Links — 1 Primary Action
 */

import React from 'react';
import { Film, Sparkles, FileText, FolderOpen, Download } from 'lucide-react';

export type ScreenTab = 'studio' | 'gallery' | 'script';

interface HeaderProps {
  activeScreen: ScreenTab;
  onScreenChange: (tab: ScreenTab) => void;
  onOpenProjects: () => void;
  onOpenExport: () => void;
  selectedEffectsCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeScreen,
  onScreenChange,
  onOpenProjects,
  onOpenExport,
  selectedEffectsCount,
}) => {
  return (
    <header className="h-14 border-b border-white/10 bg-[#0B0B10]/95 backdrop-blur-md px-6 flex items-center justify-between gap-8 shrink-0 z-30 select-none">
      {/* Zone 1: Single text element wordmark with icon */}
      <div className="flex items-center gap-2.5 whitespace-nowrap shrink-0">
        <div className="w-8 h-8 rounded-lg bg-[#FFD54F] flex items-center justify-center text-[#0B0B10] shadow-md shadow-[#FFD54F]/20 font-black text-sm tracking-tighter">
          <Film className="w-4 h-4 stroke-[2.5]" />
        </div>
        <span className="font-extrabold text-base tracking-tight text-white flex items-center gap-1.5">
          CodeMotion <span className="text-[#FFD54F] font-semibold text-xs tracking-normal px-1.5 py-0.5 rounded bg-[#FFD54F]/10 border border-[#FFD54F]/30">Studio</span>
        </span>
      </div>

      {/* Zone 2: Navigation Links */}
      <nav className="flex items-center gap-2">
        <button
          onClick={() => onScreenChange('studio')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 transition-colors ${
            activeScreen === 'studio'
              ? 'bg-white/10 text-white border border-white/15 shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Film className="w-3.5 h-3.5 text-[#FFD54F]" />
          Project Studio
        </button>

        <button
          onClick={() => onScreenChange('gallery')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 transition-colors ${
            activeScreen === 'gallery'
              ? 'bg-white/10 text-white border border-white/15 shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-[#FFD54F]" />
          Effects Gallery
          {selectedEffectsCount > 0 && (
            <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-[#FFD54F] text-[#0B0B10]">
              {selectedEffectsCount}
            </span>
          )}
        </button>

        <button
          onClick={() => onScreenChange('script')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 transition-colors ${
            activeScreen === 'script'
              ? 'bg-white/10 text-white border border-white/15 shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <FileText className="w-3.5 h-3.5 text-[#FFD54F]" />
          New Script
        </button>
      </nav>

      {/* Zone 3: Primary Action & Project Controls */}
      <div className="flex items-center gap-2.5 shrink-0">
        <button
          onClick={onOpenProjects}
          title="Open or Manage Projects"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 bg-white/5 hover:bg-white/10 border border-white/10 transition-colors whitespace-nowrap shrink-0"
        >
          <FolderOpen className="w-3.5 h-3.5 text-slate-400" />
          Projects
        </button>

        <button
          onClick={onOpenExport}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold text-[#0B0B10] bg-[#FFD54F] hover:bg-[#FFE082] shadow-sm shadow-[#FFD54F]/25 transition-all whitespace-nowrap shrink-0 cursor-pointer active:scale-95"
        >
          <Download className="w-3.5 h-3.5 stroke-[2.5]" />
          Export MP4
        </button>
      </div>
    </header>
  );
};

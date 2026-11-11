/**
 * Scene Bar Component
 * Scene chips to switch/add/delete scenes, scene duration control, and scene background.
 */

import React, { useState } from 'react';
import { Scene } from '../../types';
import { Plus, Trash2, Clock, Palette } from 'lucide-react';

interface SceneBarProps {
  scenes: Scene[];
  activeSceneId: string;
  onSelectScene: (id: string) => void;
  onAddScene: () => void;
  onDeleteScene: (id: string) => void;
  onUpdateScene: (id: string, updates: Partial<Scene>) => void;
}

export const SceneBar: React.FC<SceneBarProps> = ({
  scenes,
  activeSceneId,
  onSelectScene,
  onAddScene,
  onDeleteScene,
  onUpdateScene,
}) => {
  const activeScene = scenes.find((s) => s.id === activeSceneId) || scenes[0];
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(activeScene?.name || '');

  const handleNameBlur = () => {
    setIsEditingName(false);
    if (activeScene && nameInput.trim()) {
      onUpdateScene(activeScene.id, { name: nameInput.trim() });
    }
  };

  return (
    <div className="h-11 bg-[#10111A] border-b border-white/10 px-4 flex items-center justify-between gap-4 shrink-0 select-none overflow-x-auto">
      {/* Left: Scene Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto py-1">
        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mr-1">
          Scenes:
        </span>
        {scenes.map((scene, index) => {
          const isActive = scene.id === activeSceneId;
          return (
            <button
              key={scene.id}
              onClick={() => onSelectScene(scene.id)}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                isActive
                  ? 'bg-[#FFD54F] text-[#0B0B10] font-bold shadow-sm'
                  : 'bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white'
              }`}
            >
              <span>Scene {index + 1}</span>
              <span className={`text-[10px] ${isActive ? 'text-[#0B0B10]/70' : 'text-slate-400 font-mono'}`}>
                ({(scene.durationMs / 1000).toFixed(1)}s)
              </span>
            </button>
          );
        })}

        {/* Add Scene Button */}
        <button
          onClick={onAddScene}
          title="Add Scene"
          className="flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-colors whitespace-nowrap cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5 text-[#FFD54F]" />
          <span>Add Scene</span>
        </button>
      </div>

      {/* Right: Active Scene Settings (Name, Duration, Delete) */}
      {activeScene && (
        <div className="flex items-center gap-3 shrink-0">
          {/* Scene Name Edit */}
          <div className="flex items-center gap-1.5 text-xs text-slate-300">
            {isEditingName ? (
              <input
                type="text"
                value={nameInput}
                autoFocus
                onChange={(e) => setNameInput(e.target.value)}
                onBlur={handleNameBlur}
                onKeyDown={(e) => e.key === 'Enter' && handleNameBlur()}
                className="px-2 py-0.5 bg-black/50 border border-[#FFD54F] rounded text-xs text-white outline-none w-36"
              />
            ) : (
              <span
                onClick={() => {
                  setNameInput(activeScene.name);
                  setIsEditingName(true);
                }}
                className="cursor-pointer hover:text-[#FFD54F] transition-colors underline decoration-dotted underline-offset-2"
                title="Click to rename scene"
              >
                {activeScene.name}
              </span>
            )}
          </div>

          {/* Scene Duration Input */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-white/5 rounded-md border border-white/10 text-xs">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <input
              type="number"
              min="500"
              max="30000"
              step="100"
              value={activeScene.durationMs}
              onChange={(e) =>
                onUpdateScene(activeScene.id, {
                  durationMs: Math.max(500, parseInt(e.target.value) || 3000),
                })
              }
              className="w-16 bg-transparent text-white font-mono text-xs focus:outline-none text-right tabular-nums"
            />
            <span className="text-[11px] text-slate-400 font-mono">ms</span>
          </div>

          {/* Background color chip */}
          <div className="flex items-center gap-1">
            <input
              type="color"
              value={activeScene.bg || '#0B0B10'}
              onChange={(e) => onUpdateScene(activeScene.id, { bg: e.target.value })}
              className="w-5 h-5 rounded cursor-pointer border border-white/20 bg-transparent p-0"
              title="Scene Background Color"
            />
          </div>

          {/* Delete Scene Button */}
          {scenes.length > 1 && (
            <button
              onClick={() => onDeleteScene(activeScene.id)}
              title="Delete this scene"
              className="p-1 rounded text-slate-400 hover:text-red-400 hover:bg-red-400/10 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}
    </div>
  );
};

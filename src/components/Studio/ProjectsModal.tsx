/**
 * Projects Manager Modal
 * Manage, save, import, and load project.json files using localStorage and files.
 */

import React, { useState } from 'react';
import { Project } from '../../types';
import { DEMO_PROJECT } from '../../engine/demoProject';
import {
  FolderOpen,
  Plus,
  Download,
  Upload,
  Trash2,
  Copy,
  Check,
  X,
  Sparkles,
} from 'lucide-react';

interface ProjectsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentProject: Project;
  savedProjects: Project[];
  onLoadProject: (project: Project) => void;
  onSaveCurrentProject: () => void;
  onDeleteSavedProject: (projectId: string) => void;
  onDuplicateSavedProject: (project: Project) => void;
  onNewBlankProject: () => void;
}

export const ProjectsModal: React.FC<ProjectsModalProps> = ({
  isOpen,
  onClose,
  currentProject,
  savedProjects,
  onLoadProject,
  onSaveCurrentProject,
  onDeleteSavedProject,
  onDuplicateSavedProject,
  onNewBlankProject,
}) => {
  const [importError, setImportError] = useState<string | null>(null);

  if (!isOpen) return null;

  // Handle Import project.json
  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text) as Project;

        if (!parsed.scenes || !Array.isArray(parsed.scenes)) {
          throw new Error('Invalid project.json: missing scenes array');
        }

        onLoadProject(parsed);
        onClose();
      } catch (err: any) {
        setImportError(err.message || 'Failed to parse project.json file');
      }
    };
    reader.readAsText(file);
  };

  // Handle Export / Download project.json
  const handleDownloadProjectJSON = (proj: Project) => {
    const jsonStr = JSON.stringify(proj, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const cleanTitle = (proj.title || 'project').toLowerCase().replace(/[^a-z0-9_-]/g, '_');
    a.download = `${cleanTitle}.project.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-[#141522] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="h-14 px-6 border-b border-white/10 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#FFD54F]/20 text-[#FFD54F] flex items-center justify-center">
              <FolderOpen className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white tracking-tight">Project Management</h2>
              <span className="text-[11px] text-slate-400">
                Saved in browser LocalStorage & JSON export
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Action Toolbar */}
        <div className="p-4 bg-[#10111A] border-b border-white/10 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onNewBlankProject();
                onClose();
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#FFD54F] text-[#0B0B10] hover:bg-[#FFE082] transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              New Project
            </button>

            <button
              onClick={() => {
                onLoadProject(DEMO_PROJECT);
                onClose();
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-200 bg-white/5 hover:bg-white/10 border border-white/10 transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#FFD54F]" />
              Load Built-in Demo
            </button>
          </div>

          <div className="flex items-center gap-2">
            {/* Import project.json */}
            <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-200 bg-white/5 hover:bg-white/10 border border-white/10 transition-colors cursor-pointer">
              <Upload className="w-3.5 h-3.5 text-slate-400" />
              <span>Import project.json</span>
              <input
                type="file"
                accept=".json,application/json"
                onChange={handleImportFile}
                className="hidden"
              />
            </label>

            {/* Save Current */}
            <button
              onClick={onSaveCurrentProject}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-[#FFD54F] bg-[#FFD54F]/10 hover:bg-[#FFD54F]/20 border border-[#FFD54F]/30 transition-colors"
            >
              <Check className="w-3.5 h-3.5" />
              Save Current
            </button>
          </div>
        </div>

        {/* Error Alert */}
        {importError && (
          <div className="m-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-300">
            {importError}
          </div>
        )}

        {/* Saved Projects List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">
            Saved Projects ({savedProjects.length})
          </span>

          {savedProjects.length === 0 ? (
            <div className="p-8 text-center text-slate-500 bg-black/20 rounded-xl border border-white/5">
              <p className="text-xs">No saved projects found in local storage.</p>
              <p className="text-[11px] text-slate-600 mt-1">
                Save the current project or load the built-in demo.
              </p>
            </div>
          ) : (
            savedProjects.map((proj) => {
              const isCurrent = proj.id === currentProject.id;
              const totalLayers = proj.scenes.reduce((acc, s) => acc + s.layers.length, 0);
              const totalDurationSec = (
                proj.scenes.reduce((acc, s) => acc + s.durationMs, 0) / 1000
              ).toFixed(1);

              return (
                <div
                  key={proj.id}
                  className={`p-4 rounded-xl border flex items-center justify-between gap-4 transition-all ${
                    isCurrent
                      ? 'border-[#FFD54F] bg-[#FFD54F]/5 ring-1 ring-[#FFD54F]/30'
                      : 'border-white/10 bg-white/[0.02] hover:bg-white/[0.05]'
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-sm text-white truncate">
                        {proj.title}
                      </h4>
                      {isCurrent && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-[#FFD54F] text-[#0B0B10]">
                          Active
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                      <span>{proj.scenes.length} Scenes</span>
                      <span>·</span>
                      <span>{totalLayers} Layers</span>
                      <span>·</span>
                      <span className="font-mono">{totalDurationSec}s</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => handleDownloadProjectJSON(proj)}
                      title="Download project.json"
                      className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => onDuplicateSavedProject(proj)}
                      title="Duplicate Project"
                      className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>

                    {!isCurrent && (
                      <button
                        onClick={() => {
                          onLoadProject(proj);
                          onClose();
                        }}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white/10 hover:bg-white/20 text-white transition-colors"
                      >
                        Open
                      </button>
                    )}

                    <button
                      onClick={() => onDeleteSavedProject(proj.id)}
                      title="Delete Project"
                      className="p-2 rounded-lg hover:bg-red-500/10 text-slate-500 hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

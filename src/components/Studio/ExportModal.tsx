/**
 * Export MP4 Modal Dialog
 * Displays rendering progress, frame counts, WebCodecs/MediaRecorder status,
 * video preview, and download triggers.
 */

import React, { useState, useEffect, useRef } from 'react';
import { Project, Scene } from '../../types';
import { ProjectExporter, ExportProgress } from '../../engine/exporter';
import { Download, X, Film, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project;
  activeSceneId: string;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  project,
  activeSceneId,
}) => {
  const [exportScope, setExportScope] = useState<'all' | 'current'>('all');
  const [progress, setProgress] = useState<ExportProgress | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const exporterRef = useRef<ProjectExporter | null>(null);

  useEffect(() => {
    if (!isOpen) {
      if (isExporting && exporterRef.current) {
        exporterRef.current.cancel();
      }
      setIsExporting(false);
      setProgress(null);
      setDownloadUrl(null);
      setErrorMsg(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleStartExport = async () => {
    setIsExporting(true);
    setErrorMsg(null);
    setDownloadUrl(null);

    const exporter = new ProjectExporter();
    exporterRef.current = exporter;

    try {
      const url = await exporter.exportVideo(
        project,
        exportScope === 'current',
        activeSceneId,
        (p) => setProgress(p)
      );

      setDownloadUrl(url);
      setIsExporting(false);
    } catch (err: any) {
      if (err.message !== 'Export cancelled by user' && err.message !== 'Export cancelled') {
        setErrorMsg(err.message || 'Failed to export video');
      }
      setIsExporting(false);
    }
  };

  const handleCancel = () => {
    if (exporterRef.current) {
      exporterRef.current.cancel();
    }
    setIsExporting(false);
    onClose();
  };

  const handleDownloadFile = () => {
    if (!downloadUrl) return;
    const a = document.createElement('a');
    a.href = downloadUrl;
    const cleanTitle = (project.title || 'codemotion_video').toLowerCase().replace(/[^a-z0-9_-]/g, '_');
    a.download = `${cleanTitle}_1080x1920.mp4`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-[#141522] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="h-14 px-6 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#FFD54F]/20 text-[#FFD54F] flex items-center justify-center">
              <Film className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white tracking-tight">Export MP4 Video</h2>
              <span className="text-[11px] text-slate-400 font-mono">1080x1920 (9:16) · 30fps</span>
            </div>
          </div>

          <button
            onClick={handleCancel}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5">
          {!isExporting && !downloadUrl && (
            <>
              {/* Export Scope Selector */}
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-2">
                  Select Scope
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setExportScope('all')}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      exportScope === 'all'
                        ? 'border-[#FFD54F] bg-[#FFD54F]/10 text-white'
                        : 'border-white/10 bg-white/5 text-slate-400 hover:text-white'
                    }`}
                  >
                    <span className="font-semibold text-xs block text-white">All Scenes ({project.scenes.length})</span>
                    <span className="text-[11px] text-slate-400 block mt-0.5">
                      Stitches entire sequence into complete video
                    </span>
                  </button>

                  <button
                    onClick={() => setExportScope('current')}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      exportScope === 'current'
                        ? 'border-[#FFD54F] bg-[#FFD54F]/10 text-white'
                        : 'border-white/10 bg-white/5 text-slate-400 hover:text-white'
                    }`}
                  >
                    <span className="font-semibold text-xs block text-white">Current Scene Only</span>
                    <span className="text-[11px] text-slate-400 block mt-0.5">
                      Fast render of currently active scene
                    </span>
                  </button>
                </div>
              </div>

              {/* Technical Specifications Callout */}
              <div className="p-3 bg-black/40 rounded-xl border border-white/5 space-y-1 text-xs text-slate-400 font-mono">
                <div className="flex justify-between">
                  <span>Engine:</span>
                  <span className="text-slate-200">WebCodecs + mp4-muxer</span>
                </div>
                <div className="flex justify-between">
                  <span>Resolution:</span>
                  <span className="text-slate-200">1080 × 1920 (Portrait 9:16)</span>
                </div>
                <div className="flex justify-between">
                  <span>Bitrate:</span>
                  <span className="text-slate-200">8,000 kbps (H.264 AVC)</span>
                </div>
              </div>
            </>
          )}

          {/* Export in Progress State */}
          {isExporting && progress && (
            <div className="space-y-4 py-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-white flex items-center gap-2">
                  <Loader2 className="w-3.5 h-3.5 text-[#FFD54F] animate-spin" />
                  {progress.status === 'initializing'
                    ? 'Preparing render buffers...'
                    : progress.status === 'muxing'
                    ? 'Muxing MP4 containers...'
                    : 'Encoding frames...'}
                </span>
                <span className="font-mono text-[#FFD54F] font-bold text-sm tabular-nums">
                  {progress.percentage}%
                </span>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden p-0.5">
                <div
                  className="h-full bg-[#FFD54F] rounded-full transition-all duration-150 shadow-sm shadow-[#FFD54F]/50"
                  style={{ width: `${progress.percentage}%` }}
                />
              </div>

              <div className="flex justify-between text-[11px] font-mono text-slate-400">
                <span>
                  Frame {progress.currentFrame} / {progress.totalFrames}
                </span>
                <span>Deterministic 30fps</span>
              </div>
            </div>
          )}

          {/* Completed State */}
          {downloadUrl && (
            <div className="space-y-4 text-center py-2">
              <div className="inline-flex p-3 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-1">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold text-white">Video Rendered Successfully!</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Deterministic 1080x1920 MP4 file is ready for download.
              </p>

              {/* Video Preview */}
              <div className="max-w-[220px] mx-auto rounded-xl overflow-hidden border border-white/20 shadow-xl bg-black">
                <video
                  src={downloadUrl}
                  controls
                  autoPlay
                  loop
                  playsInline
                  className="w-full h-auto max-h-60 object-contain block"
                />
              </div>
            </div>
          )}

          {/* Error State */}
          {errorMsg && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{errorMsg}</span>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="h-16 px-6 bg-[#10111A] border-t border-white/10 flex items-center justify-between gap-3">
          <button
            onClick={handleCancel}
            className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white transition-colors"
          >
            {downloadUrl ? 'Close' : 'Cancel'}
          </button>

          {!isExporting && !downloadUrl && (
            <button
              onClick={handleStartExport}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-[#FFD54F] text-[#0B0B10] hover:bg-[#FFE082] shadow-sm shadow-[#FFD54F]/25 transition-all cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 stroke-[2.5]" />
              Start MP4 Export
            </button>
          )}

          {downloadUrl && (
            <button
              onClick={handleDownloadFile}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-[#FFD54F] text-[#0B0B10] hover:bg-[#FFE082] shadow-md shadow-[#FFD54F]/25 transition-all cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 stroke-[2.5]" />
              Download MP4 File
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

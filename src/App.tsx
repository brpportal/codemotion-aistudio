/**
 * CodeMotion Studio — Main Application Entry
 * Mobile-Style Motion Graphics Video Editor (Dark Theme #0B0B10, Yellow Accent #FFD54F)
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Project, Scene, Layer, LayerType, EffectId } from './types';
import { DEMO_PROJECT } from './engine/demoProject';
import { Header, ScreenTab } from './components/Header';
import { EffectsGallery } from './components/EffectsGallery';
import { ScriptGenerator } from './components/ScriptGenerator';
import { SceneBar } from './components/Studio/SceneBar';
import { CanvasPlayer } from './components/Studio/CanvasPlayer';
import { Timeline } from './components/Studio/Timeline';
import { PropertyPanel } from './components/Studio/PropertyPanel';
import { ExportModal } from './components/Studio/ExportModal';
import { ProjectsModal } from './components/Studio/ProjectsModal';

const STORAGE_KEY = 'codemotion_saved_projects_v1';

export default function App() {
  const [activeScreen, setActiveScreen] = useState<ScreenTab>('studio');

  // Project & Scene State (Loads DEMO_PROJECT by default as required)
  const [project, setProject] = useState<Project>(DEMO_PROJECT);
  const [activeSceneId, setActiveSceneId] = useState<string>(DEMO_PROJECT.scenes[0].id);
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null);

  // Playback State
  const [playheadMs, setPlayheadMs] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isLooping, setIsLooping] = useState<boolean>(true);
  const lastFrameTimeRef = useRef<number | null>(null);

  // Effects selection for Script.md generator
  const [selectedEffects, setSelectedEffects] = useState<Set<EffectId>>(
    new Set(['pop-in', 'bounce-drop', 'elastic-snap', 'code-typewriter', 'circle-marker', 'underline-draw'])
  );

  // Local Storage Projects
  const [savedProjects, setSavedProjects] = useState<Project[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn('Could not load projects from localStorage:', e);
    }
    return [DEMO_PROJECT];
  });

  // Modals
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isProjectsModalOpen, setIsProjectsModalOpen] = useState(false);

  // Active scene accessor
  const activeScene = project.scenes.find((s) => s.id === activeSceneId) || project.scenes[0];

  // Save projects to localStorage whenever savedProjects change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(savedProjects));
    } catch (e) {
      console.warn('Failed to save to localStorage:', e);
    }
  }, [savedProjects]);

  // Ensure activeSceneId is valid when scenes change
  useEffect(() => {
    if (!project.scenes.some((s) => s.id === activeSceneId)) {
      setActiveSceneId(project.scenes[0]?.id || '');
      setSelectedLayerId(null);
      setPlayheadMs(0);
    }
  }, [project.scenes, activeSceneId]);

  // Playback Animation Loop
  useEffect(() => {
    if (!isPlaying) {
      lastFrameTimeRef.current = null;
      return;
    }

    let animId: number;

    const tick = (now: number) => {
      if (lastFrameTimeRef.current === null) {
        lastFrameTimeRef.current = now;
      }
      const delta = now - lastFrameTimeRef.current;
      lastFrameTimeRef.current = now;

      setPlayheadMs((prev) => {
        const sceneDuration = activeScene?.durationMs || 3000;
        const nextTime = prev + delta;

        if (nextTime >= sceneDuration) {
          if (isLooping) {
            return 0;
          } else {
            setIsPlaying(false);
            return sceneDuration;
          }
        }
        return nextTime;
      });

      animId = requestAnimationFrame(tick);
    };

    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, [isPlaying, isLooping, activeScene?.durationMs]);

  // Keyboard Shortcuts (Space for Play/Pause)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Avoid intercepting when typing in inputs/textareas
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT')) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        setIsPlaying((p) => !p);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Toggle Effect selection helper
  const handleToggleEffect = (id: EffectId) => {
    setSelectedEffects((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSelectAllEffects = () => {
    import('./engine/effects').then(({ EFFECTS_CATALOG }) => {
      setSelectedEffects(new Set(EFFECTS_CATALOG.map((e) => e.id)));
    });
  };

  const handleClearSelectedEffects = () => {
    setSelectedEffects(new Set());
  };

  // Scene Operations
  const handleAddScene = () => {
    const newSceneNumber = project.scenes.length + 1;
    const newScene: Scene = {
      id: `scene-${Date.now()}`,
      name: `Scene ${newSceneNumber}`,
      durationMs: 3000,
      bg: '#0B0B10',
      layers: [
        {
          id: `layer-${Date.now()}-1`,
          type: 'text',
          effect: 'pop-in',
          startMs: 200,
          durationMs: 700,
          x: 90,
          y: 650,
          w: 900,
          h: 120,
          text: `SCENE ${newSceneNumber} TITLE`,
          color: '#FFD54F',
          fontSize: 72,
          textAlign: 'center',
          spring: 'snappy',
        },
      ],
    };

    setProject((prev) => ({
      ...prev,
      scenes: [...prev.scenes, newScene],
      updatedAt: Date.now(),
    }));

    setActiveSceneId(newScene.id);
    setSelectedLayerId(newScene.layers[0].id);
    setPlayheadMs(0);
  };

  const handleDeleteScene = (sceneId: string) => {
    if (project.scenes.length <= 1) return;
    setProject((prev) => {
      const remaining = prev.scenes.filter((s) => s.id !== sceneId);
      return {
        ...prev,
        scenes: remaining,
        updatedAt: Date.now(),
      };
    });
  };

  const handleUpdateScene = (sceneId: string, updates: Partial<Scene>) => {
    setProject((prev) => ({
      ...prev,
      scenes: prev.scenes.map((s) => (s.id === sceneId ? { ...s, ...updates } : s)),
      updatedAt: Date.now(),
    }));
  };

  // Layer Operations
  const handleAddLayer = (type: LayerType) => {
    if (!activeScene) return;

    const layerId = `layer-${Date.now()}`;
    const start = Math.round(playheadMs);

    let newLayer: Layer;

    switch (type) {
      case 'text':
        newLayer = {
          id: layerId,
          type: 'text',
          effect: 'pop-in',
          startMs: start,
          durationMs: 800,
          x: 90,
          y: 750,
          w: 900,
          h: 100,
          text: 'NEW HEADLINE',
          color: '#FFFFFF',
          fontSize: 64,
          textAlign: 'center',
          spring: 'snappy',
        };
        break;

      case 'code':
        newLayer = {
          id: layerId,
          type: 'code',
          effect: 'code-typewriter',
          startMs: start,
          durationMs: 1600,
          x: 90,
          y: 540,
          w: 900,
          h: 580,
          code: `const animate = spring({\n  stiffness: 260,\n  damping: 14,\n});`,
          bg: '#11121B',
          fontSize: 34,
          borderRadius: 20,
          highlightLine: 2,
        };
        break;

      case 'card':
        newLayer = {
          id: layerId,
          type: 'card',
          effect: 'slide-card',
          startMs: start,
          durationMs: 800,
          x: 140,
          y: 800,
          w: 800,
          h: 160,
          text: 'Container Card Content',
          color: '#FFFFFF',
          bg: '#141522',
          fontSize: 36,
          borderRadius: 20,
          spring: 'snappy',
        };
        break;

      case 'image':
        newLayer = {
          id: layerId,
          type: 'image',
          effect: 'pop-in',
          startMs: start,
          durationMs: 700,
          x: 190,
          y: 600,
          w: 700,
          h: 600,
          borderRadius: 24,
          spring: 'snappy',
        };
        break;

      case 'highlight':
        newLayer = {
          id: layerId,
          type: 'highlight',
          effect: 'highlight-sweep',
          startMs: start,
          durationMs: 600,
          x: 180,
          y: 840,
          w: 720,
          h: 60,
          bg: 'rgba(255, 213, 79, 0.35)',
        };
        break;
    }

    setProject((prev) => ({
      ...prev,
      scenes: prev.scenes.map((s) =>
        s.id === activeScene.id
          ? { ...s, layers: [...s.layers, newLayer] }
          : s
      ),
      updatedAt: Date.now(),
    }));

    setSelectedLayerId(layerId);
  };

  const handleUpdateLayer = (layerId: string, updates: Partial<Layer>) => {
    if (!activeScene) return;
    setProject((prev) => ({
      ...prev,
      scenes: prev.scenes.map((s) =>
        s.id === activeScene.id
          ? {
              ...s,
              layers: s.layers.map((l) => (l.id === layerId ? { ...l, ...updates } : l)),
            }
          : s
      ),
      updatedAt: Date.now(),
    }));
  };

  const handleDuplicateLayer = (layerId: string) => {
    if (!activeScene) return;
    const layer = activeScene.layers.find((l) => l.id === layerId);
    if (!layer) return;

    const duplicated: Layer = {
      ...layer,
      id: `layer-${Date.now()}`,
      x: layer.x + 30,
      y: layer.y + 30,
    };

    setProject((prev) => ({
      ...prev,
      scenes: prev.scenes.map((s) =>
        s.id === activeScene.id
          ? { ...s, layers: [...s.layers, duplicated] }
          : s
      ),
      updatedAt: Date.now(),
    }));

    setSelectedLayerId(duplicated.id);
  };

  const handleDeleteLayer = (layerId: string) => {
    if (!activeScene) return;
    setProject((prev) => ({
      ...prev,
      scenes: prev.scenes.map((s) =>
        s.id === activeScene.id
          ? { ...s, layers: s.layers.filter((l) => l.id !== layerId) }
          : s
      ),
      updatedAt: Date.now(),
    }));
    if (selectedLayerId === layerId) {
      setSelectedLayerId(null);
    }
  };

  const handleMoveLayerUp = (layerId: string) => {
    if (!activeScene) return;
    const layers = [...activeScene.layers];
    const index = layers.findIndex((l) => l.id === layerId);
    if (index >= layers.length - 1) return;
    const temp = layers[index];
    layers[index] = layers[index + 1];
    layers[index + 1] = temp;

    setProject((prev) => ({
      ...prev,
      scenes: prev.scenes.map((s) => (s.id === activeScene.id ? { ...s, layers } : s)),
    }));
  };

  const handleMoveLayerDown = (layerId: string) => {
    if (!activeScene) return;
    const layers = [...activeScene.layers];
    const index = layers.findIndex((l) => l.id === layerId);
    if (index <= 0) return;
    const temp = layers[index];
    layers[index] = layers[index - 1];
    layers[index - 1] = temp;

    setProject((prev) => ({
      ...prev,
      scenes: prev.scenes.map((s) => (s.id === activeScene.id ? { ...s, layers } : s)),
    }));
  };

  // Project Management Actions
  const handleSaveCurrentProject = () => {
    setSavedProjects((prev) => {
      const existing = prev.findIndex((p) => p.id === project.id);
      if (existing >= 0) {
        const copy = [...prev];
        copy[existing] = { ...project, updatedAt: Date.now() };
        return copy;
      } else {
        return [{ ...project, updatedAt: Date.now() }, ...prev];
      }
    });

    // Also download JSON
    const jsonStr = JSON.stringify(project, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const cleanTitle = (project.title || 'project').toLowerCase().replace(/[^a-z0-9_-]/g, '_');
    a.download = `${cleanTitle}.project.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleLoadProject = (newProject: Project) => {
    setProject(newProject);
    setActiveSceneId(newProject.scenes[0]?.id || '');
    setSelectedLayerId(null);
    setPlayheadMs(0);
    setIsPlaying(false);
  };

  const handleDeleteSavedProject = (projectId: string) => {
    setSavedProjects((prev) => prev.filter((p) => p.id !== projectId));
  };

  const handleDuplicateSavedProject = (projToDup: Project) => {
    const duplicated: Project = {
      ...projToDup,
      id: `proj-${Date.now()}`,
      title: `${projToDup.title} (Copy)`,
      updatedAt: Date.now(),
    };
    setSavedProjects((prev) => [duplicated, ...prev]);
  };

  const handleNewBlankProject = () => {
    const blank: Project = {
      id: `proj-${Date.now()}`,
      title: 'Untitled Motion Video',
      canvas: { width: 1080, height: 1920, fps: 30 },
      scenes: [
        {
          id: `scene-${Date.now()}`,
          name: 'Scene 1',
          durationMs: 3000,
          bg: '#0B0B10',
          layers: [
            {
              id: `layer-${Date.now()}`,
              type: 'text',
              effect: 'pop-in',
              startMs: 200,
              durationMs: 700,
              x: 90,
              y: 700,
              w: 900,
              h: 120,
              text: 'MOTION GRAPHICS',
              color: '#FFD54F',
              fontSize: 72,
              textAlign: 'center',
              spring: 'snappy',
            },
          ],
        },
      ],
      updatedAt: Date.now(),
    };
    handleLoadProject(blank);
  };

  const selectedLayer = activeScene?.layers.find((l) => l.id === selectedLayerId) || null;

  return (
    <div className="w-screen h-screen flex flex-col bg-[#0B0B10] text-slate-100 overflow-hidden font-sans">
      {/* Top Bar Contract Header */}
      <Header
        activeScreen={activeScreen}
        onScreenChange={setActiveScreen}
        onOpenProjects={() => setIsProjectsModalOpen(true)}
        onOpenExport={() => setIsExportModalOpen(true)}
        selectedEffectsCount={selectedEffects.size}
      />

      {/* Screen 1: Effects Gallery */}
      {activeScreen === 'gallery' && (
        <EffectsGallery
          selectedEffects={selectedEffects}
          onToggleEffect={handleToggleEffect}
          onSelectAll={handleSelectAllEffects}
          onClearSelection={handleClearSelectedEffects}
          onNavigateToScript={() => setActiveScreen('script')}
        />
      )}

      {/* Screen 2: New Script */}
      {activeScreen === 'script' && (
        <ScriptGenerator
          selectedEffects={selectedEffects}
          onToggleEffect={handleToggleEffect}
          onLoadProject={handleLoadProject}
          onNavigateToStudio={() => setActiveScreen('studio')}
        />
      )}

      {/* Screen 3: Project Studio (Editor) */}
      {activeScreen === 'studio' && activeScene && (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Scene Bar */}
          <SceneBar
            scenes={project.scenes}
            activeSceneId={activeScene.id}
            onSelectScene={(id) => {
              setActiveSceneId(id);
              setSelectedLayerId(null);
              setPlayheadMs(0);
            }}
            onAddScene={handleAddScene}
            onDeleteScene={handleDeleteScene}
            onUpdateScene={handleUpdateScene}
          />

          {/* Studio Workspace: Canvas & Property Panel on Top, Timeline at Bottom */}
          <div className="flex-1 flex overflow-hidden">
            {/* Center Canvas Viewport */}
            <CanvasPlayer
              scene={activeScene}
              playheadMs={playheadMs}
              isPlaying={isPlaying}
              isLooping={isLooping}
              selectedLayerId={selectedLayerId}
              onPlayheadChange={setPlayheadMs}
              onTogglePlay={() => setIsPlaying((p) => !p)}
              onToggleLoop={() => setIsLooping((l) => !l)}
              onSelectLayer={setSelectedLayerId}
              onUpdateLayer={handleUpdateLayer}
              onAddLayer={handleAddLayer}
            />

            {/* Right Property Panel */}
            <PropertyPanel
              layer={selectedLayer}
              onUpdateLayer={handleUpdateLayer}
              onDuplicateLayer={handleDuplicateLayer}
              onDeleteLayer={handleDeleteLayer}
              onMoveLayerUp={handleMoveLayerUp}
              onMoveLayerDown={handleMoveLayerDown}
            />
          </div>

          {/* Bottom Sequencer Timeline */}
          <Timeline
            scene={activeScene}
            playheadMs={playheadMs}
            selectedLayerId={selectedLayerId}
            onPlayheadChange={setPlayheadMs}
            onSelectLayer={setSelectedLayerId}
            onUpdateLayer={handleUpdateLayer}
          />
        </div>
      )}

      {/* Export MP4 Modal */}
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        project={project}
        activeSceneId={activeScene?.id || ''}
      />

      {/* Projects Modal */}
      <ProjectsModal
        isOpen={isProjectsModalOpen}
        onClose={() => setIsProjectsModalOpen(false)}
        currentProject={project}
        savedProjects={savedProjects}
        onLoadProject={handleLoadProject}
        onSaveCurrentProject={handleSaveCurrentProject}
        onDeleteSavedProject={handleDeleteSavedProject}
        onDuplicateSavedProject={handleDuplicateSavedProject}
        onNewBlankProject={handleNewBlankProject}
      />
    </div>
  );
}

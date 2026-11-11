/**
 * CodeMotion Studio Type Definitions
 */

export type LayerType = 'text' | 'code' | 'card' | 'image' | 'highlight';

export type EffectId =
  | 'pop-in'
  | 'slide-up'
  | 'typewriter'
  | 'word-reveal'
  | 'keyword-pulse'
  | 'char-stagger-in'
  | 'highlight-sweep'
  | 'underline-draw'
  | 'counter-up'
  | 'code-typewriter'
  | 'line-highlight'
  | 'zoom-to-line'
  | 'slide-card'
  | 'flip-in'
  | 'draw-arrow'
  | 'circle-marker'
  | 'box-marker'
  | 'path-arrow'
  | 'bounce-drop'
  | 'elastic-snap'
  | 'push-in'
  | 'pan'
  | 'impact-shake'
  | 'whoosh'
  | 'fade'
  | 'glow-pulse';

export type EasingId =
  | 'linear'
  | 'sine.in'
  | 'sine.out'
  | 'sine.inOut'
  | 'power1.in'
  | 'power1.out'
  | 'power1.inOut'
  | 'power2.in'
  | 'power2.out'
  | 'power2.inOut'
  | 'power3.in'
  | 'power3.out'
  | 'power3.inOut'
  | 'power4.in'
  | 'power4.out'
  | 'power4.inOut'
  | 'expo.in'
  | 'expo.out'
  | 'expo.inOut'
  | 'circ.in'
  | 'circ.out'
  | 'circ.inOut'
  | 'back.in'
  | 'back.out'
  | 'back.inOut'
  | 'elastic.in'
  | 'elastic.out'
  | 'elastic.inOut'
  | 'bounce.in'
  | 'bounce.out'
  | 'bounce.inOut';

export type SpringProfile = 'smooth' | 'snappy' | 'bouncy';

export interface Layer {
  id: string;
  type: LayerType;
  effect: EffectId;
  startMs: number;
  durationMs: number;
  x: number;
  y: number;
  w: number;
  h: number;
  text?: string;
  code?: string;
  color?: string; // #RRGGBB
  bg?: string; // #AARRGGBB or #RRGGBB
  fontSize?: number;
  easing?: EasingId;
  spring?: SpringProfile;
  stagger?: number; // ms per unit (char or word)
  opacity?: number; // 0 to 1
  rotation?: number; // degrees
  hidden?: boolean;
  locked?: boolean;
  imageUrl?: string;
  textAlign?: 'left' | 'center' | 'right';
  borderRadius?: number;
  highlightLine?: number; // for line-highlight and zoom-to-line
}

export interface Scene {
  id: string;
  name: string;
  durationMs: number;
  layers: Layer[];
  bg?: string;
}

export interface ProjectCanvas {
  width: number; // 1080
  height: number; // 1920
  fps: number; // 30
}

export interface Project {
  id: string;
  title: string;
  canvas: ProjectCanvas;
  scenes: Scene[];
  updatedAt?: number;
}

export interface EffectMeta {
  id: EffectId;
  name: string;
  category: 'Entrance' | 'Text & Typing' | 'Markers & Highlights' | 'Dynamic & Camera' | 'Continuous';
  description: string;
  defaultEasing: EasingId;
  defaultDurationMs: number;
  supportsSpring?: boolean;
  supportsStagger?: boolean;
}

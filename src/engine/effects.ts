/**
 * CodeMotion Studio Effects Catalog & Metadata
 * Contains all 26 specified motion graphics effect IDs.
 */

import { EffectId, EffectMeta } from '../types';

export const EFFECTS_CATALOG: EffectMeta[] = [
  // --- Entrance & Impact ---
  {
    id: 'pop-in',
    name: 'Pop In',
    category: 'Entrance',
    description: 'Energetic scale punch from zero with back-overshoot and opacity ramp.',
    defaultEasing: 'back.out',
    defaultDurationMs: 650,
    supportsSpring: true,
  },
  {
    id: 'slide-up',
    name: 'Slide Up',
    category: 'Entrance',
    description: 'Smooth upward emergence from below with power3 deceleration.',
    defaultEasing: 'power3.out',
    defaultDurationMs: 700,
    supportsSpring: true,
  },
  {
    id: 'bounce-drop',
    name: 'Bounce Drop',
    category: 'Entrance',
    description: 'Drops from top of screen and bounces on the ground plane 3 times.',
    defaultEasing: 'bounce.out',
    defaultDurationMs: 950,
    supportsSpring: true,
  },
  {
    id: 'elastic-snap',
    name: 'Elastic Snap',
    category: 'Entrance',
    description: 'Snaps into position with dynamic rubber-band squash & stretch oscillations.',
    defaultEasing: 'elastic.out',
    defaultDurationMs: 900,
    supportsSpring: true,
  },
  {
    id: 'whoosh',
    name: 'Whoosh',
    category: 'Entrance',
    description: 'Extreme velocity entrance from off-screen with motion streak and abrupt clamp.',
    defaultEasing: 'expo.out',
    defaultDurationMs: 500,
  },
  {
    id: 'fade',
    name: 'Fade',
    category: 'Entrance',
    description: 'Velvety smooth opacity ramp accompanied by subtle upward micro-drift.',
    defaultEasing: 'power2.out',
    defaultDurationMs: 800,
  },
  {
    id: 'impact-shake',
    name: 'Impact Shake',
    category: 'Entrance',
    description: 'Hard drop-in triggering high-frequency multi-axis screen rumble upon landing.',
    defaultEasing: 'power4.out',
    defaultDurationMs: 800,
    supportsSpring: true,
  },

  // --- Text & Code Reveals ---
  {
    id: 'typewriter',
    name: 'Typewriter',
    category: 'Text & Typing',
    description: 'Characters reveal sequentially with an active blinking cursor block.',
    defaultEasing: 'linear',
    defaultDurationMs: 1200,
    supportsStagger: true,
  },
  {
    id: 'word-reveal',
    name: 'Word Reveal',
    category: 'Text & Typing',
    description: 'Splits text into words that spring upward sequentially with cascade stagger.',
    defaultEasing: 'back.out',
    defaultDurationMs: 1100,
    supportsSpring: true,
    supportsStagger: true,
  },
  {
    id: 'char-stagger-in',
    name: 'Char Stagger In',
    category: 'Text & Typing',
    description: 'Cascading waterfall of individual letters dropping in with elastic ripple.',
    defaultEasing: 'power2.out',
    defaultDurationMs: 1300,
    supportsStagger: true,
  },
  {
    id: 'counter-up',
    name: 'Counter Up',
    category: 'Text & Typing',
    description: 'Animates digits counting up from 0 to target metrics (e.g. 99%, $500K).',
    defaultEasing: 'expo.out',
    defaultDurationMs: 1400,
  },
  {
    id: 'code-typewriter',
    name: 'Code Typewriter',
    category: 'Text & Typing',
    description: 'Dark terminal window with window chrome, typing syntax code with live caret.',
    defaultEasing: 'linear',
    defaultDurationMs: 1800,
  },

  // --- Markers & Highlights ---
  {
    id: 'highlight-sweep',
    name: 'Highlight Sweep',
    category: 'Markers & Highlights',
    description: 'Fluorescent highlighter ribbon sweeps across the content from left to right.',
    defaultEasing: 'power2.inOut',
    defaultDurationMs: 750,
  },
  {
    id: 'underline-draw',
    name: 'Underline Draw',
    category: 'Markers & Highlights',
    description: 'Bold callout line draws under the layer with rounded stroke caps.',
    defaultEasing: 'power3.out',
    defaultDurationMs: 600,
  },
  {
    id: 'circle-marker',
    name: 'Circle Marker',
    category: 'Markers & Highlights',
    description: 'Organic hand-drawn yellow loop sweeps around the targeted focal point.',
    defaultEasing: 'power2.out',
    defaultDurationMs: 800,
  },
  {
    id: 'box-marker',
    name: 'Box Marker',
    category: 'Markers & Highlights',
    description: 'Glowing bounding stroke animates around the layer with rounded bevels.',
    defaultEasing: 'power2.inOut',
    defaultDurationMs: 750,
  },
  {
    id: 'draw-arrow',
    name: 'Draw Arrow',
    category: 'Markers & Highlights',
    description: 'Dynamic pointing arrow draws its shaft progressively and blooms the head.',
    defaultEasing: 'power2.out',
    defaultDurationMs: 700,
  },
  {
    id: 'path-arrow',
    name: 'Path Arrow',
    category: 'Markers & Highlights',
    description: 'Curved bezier trajectory drawn with traveling glowing beacon head.',
    defaultEasing: 'power2.inOut',
    defaultDurationMs: 900,
  },

  // --- Dynamic & Focus ---
  {
    id: 'line-highlight',
    name: 'Line Highlight',
    category: 'Dynamic & Camera',
    description: 'Darkens background lines while spotlighting a specific code or text row.',
    defaultEasing: 'power3.out',
    defaultDurationMs: 800,
  },
  {
    id: 'zoom-to-line',
    name: 'Zoom to Line',
    category: 'Dynamic & Camera',
    description: 'Camera punches in dynamically on a single focal line of code or text.',
    defaultEasing: 'back.out',
    defaultDurationMs: 900,
    supportsSpring: true,
  },
  {
    id: 'slide-card',
    name: 'Slide Card',
    category: 'Dynamic & Camera',
    description: 'Container card slides in with 3D drop-shadow and subtle angle settle.',
    defaultEasing: 'power3.out',
    defaultDurationMs: 800,
    supportsSpring: true,
  },
  {
    id: 'flip-in',
    name: 'Flip In',
    category: 'Dynamic & Camera',
    description: 'Simulates 3D isometric flip around Y-axis from -90° to 0° face forward.',
    defaultEasing: 'power2.out',
    defaultDurationMs: 750,
  },
  {
    id: 'push-in',
    name: 'Push In',
    category: 'Dynamic & Camera',
    description: 'Punchy forward optical push from 1.8x scale down to native framing.',
    defaultEasing: 'expo.out',
    defaultDurationMs: 650,
  },
  {
    id: 'pan',
    name: 'Pan',
    category: 'Dynamic & Camera',
    description: 'Smooth, cinematic horizontal lateral drift across the frame.',
    defaultEasing: 'sine.inOut',
    defaultDurationMs: 2000,
  },

  // --- Continuous & Pulse ---
  {
    id: 'keyword-pulse',
    name: 'Keyword Pulse',
    category: 'Continuous',
    description: 'Target keywords within text periodically glow, pop scale, and accent.',
    defaultEasing: 'sine.inOut',
    defaultDurationMs: 1200,
  },
  {
    id: 'glow-pulse',
    name: 'Glow Pulse',
    category: 'Continuous',
    description: 'Continuous ambient neon breathing halo radiating from edges.',
    defaultEasing: 'sine.inOut',
    defaultDurationMs: 1400,
  },
];

export const EFFECT_MAP: Record<EffectId, EffectMeta> = EFFECTS_CATALOG.reduce(
  (acc, eff) => {
    acc[eff.id] = eff;
    return acc;
  },
  {} as Record<EffectId, EffectMeta>
);

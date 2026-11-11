/**
 * CodeMotion Studio Deterministic Canvas 2D Render Engine
 * Every visual value is a pure function of the playhead time in ms.
 * Renders at 1080x1920 (9:16) or custom canvas resolutions.
 */

import { Layer, Scene, EffectId, EasingId } from '../types';
import { evaluateEasing, evaluateSpring } from './easings';

export interface ImageCache {
  get(url: string): HTMLImageElement | null;
  load(url: string): Promise<HTMLImageElement>;
}

// Global lightweight image cache for rendered canvas
class CanvasImageCache implements ImageCache {
  private cache = new Map<string, HTMLImageElement>();
  private loading = new Map<string, Promise<HTMLImageElement>>();

  get(url: string): HTMLImageElement | null {
    const img = this.cache.get(url);
    if (img && img.complete && img.naturalWidth > 0) {
      return img;
    }
    if (!this.loading.has(url)) {
      this.load(url);
    }
    return null;
  }

  load(url: string): Promise<HTMLImageElement> {
    if (this.cache.has(url)) {
      return Promise.resolve(this.cache.get(url)!);
    }
    if (this.loading.has(url)) {
      return this.loading.get(url)!;
    }

    const p = new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        this.cache.set(url, img);
        this.loading.delete(url);
        resolve(img);
      };
      img.onerror = (e) => {
        this.loading.delete(url);
        reject(e);
      };
      img.src = url;
    });

    this.loading.set(url, p);
    return p;
  }
}

export const globalImageCache = new CanvasImageCache();

// Helper to draw rounded rectangle
export function drawRoundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  if (w < 2 * r) r = w / 2;
  if (h < 2 * r) r = h / 2;
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/**
 * Deterministic effect progress calculator
 */
function getEffectProgress(layer: Layer, sceneMs: number): {
  active: boolean;
  rawProgress: number;
  eased: number;
  relMs: number;
} {
  const relMs = sceneMs - layer.startMs;
  if (relMs < 0) {
    return { active: false, rawProgress: 0, eased: 0, relMs };
  }

  const duration = Math.max(1, layer.durationMs);
  const rawProgress = Math.min(1, Math.max(0, relMs / duration));

  let eased = rawProgress;
  if (layer.spring) {
    eased = evaluateSpring(layer.spring, rawProgress);
  } else if (layer.easing) {
    eased = evaluateEasing(layer.easing, rawProgress);
  } else {
    // Default smart easing based on effect type
    const defaultEase: EasingId =
      layer.effect === 'pop-in' ? 'back.out' :
      layer.effect === 'slide-up' ? 'power3.out' :
      layer.effect === 'bounce-drop' ? 'bounce.out' :
      layer.effect === 'elastic-snap' ? 'elastic.out' :
      layer.effect === 'whoosh' ? 'expo.out' :
      layer.effect === 'code-typewriter' || layer.effect === 'typewriter' ? 'linear' :
      'power2.out';
    eased = evaluateEasing(defaultEase, rawProgress);
  }

  return { active: true, rawProgress, eased, relMs };
}

/**
 * Syntax colorizer helper for code lines
 */
function drawSyntaxLine(
  ctx: CanvasRenderingContext2D,
  line: string,
  startX: number,
  startY: number,
  lineHeight: number,
  maxChars?: number
) {
  const textToDraw = maxChars !== undefined ? line.slice(0, maxChars) : line;
  if (!textToDraw) return;

  // Simple token regex matching keywords, strings, functions, comments
  const tokenRegex = /(\/\/.*$|"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`|\b(?:const|let|var|function|return|import|from|export|default|if|else|for|while|class|new|type|interface|async|await)\b|\b(?:true|false|null|undefined|[0-9]+)\b|[{}\[\](),;.]|[a-zA-Z_$][a-zA-Z0-9_$]*|[^\s\w])/g;

  let match: RegExpExecArray | null;
  let currentX = startX;

  // Measure space width
  const spaceWidth = ctx.measureText(' ').width;

  // Fallback if line is plain spaces
  if (!textToDraw.trim()) {
    return;
  }

  let lastIndex = 0;
  while ((match = tokenRegex.exec(textToDraw)) !== null) {
    // Check if there are spaces before the token
    if (match.index > lastIndex) {
      const whitespace = textToDraw.substring(lastIndex, match.index);
      currentX += ctx.measureText(whitespace).width;
    }

    const token = match[0];
    lastIndex = tokenRegex.lastIndex;

    // Pick token color
    if (token.startsWith('//')) {
      ctx.fillStyle = '#64748B'; // muted comment
    } else if (token.startsWith('"') || token.startsWith("'") || token.startsWith('`')) {
      ctx.fillStyle = '#4ADE80'; // emerald string
    } else if (
      /^(const|let|var|function|return|import|from|export|default|if|else|for|while|class|new|type|interface|async|await)$/.test(
        token
      )
    ) {
      ctx.fillStyle = '#FFD54F'; // yellow accent keyword
    } else if (/^(true|false|null|undefined|[0-9]+)$/.test(token)) {
      ctx.fillStyle = '#FB923C'; // orange numeric/bool
    } else if (/^[A-Z][a-zA-Z0-9_$]*$/.test(token)) {
      ctx.fillStyle = '#67E8F9'; // cyan class/type
    } else if (/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(token)) {
      ctx.fillStyle = '#E2E8F0'; // clean light identifier
    } else {
      ctx.fillStyle = '#94A3B8'; // punctuation
    }

    ctx.fillText(token, currentX, startY);
    currentX += ctx.measureText(token).width;
  }
}

/**
 * Main deterministic render function for a scene frame
 */
export function renderScene(
  ctx: CanvasRenderingContext2D,
  scene: Scene,
  sceneMs: number,
  width: number = 1080,
  height: number = 1920,
  imageCache: ImageCache = globalImageCache
) {
  // Clear canvas
  ctx.save();
  ctx.clearRect(0, 0, width, height);

  // Background
  const bg = scene.bg || '#0B0B10';
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, width, height);

  // Subtle dark studio ambient grid / vignette
  ctx.save();
  const radGrad = ctx.createRadialGradient(
    width / 2,
    height * 0.45,
    100,
    width / 2,
    height / 2,
    width * 0.95
  );
  radGrad.addColorStop(0, 'rgba(255, 213, 79, 0.04)');
  radGrad.addColorStop(0.6, 'rgba(20, 20, 32, 0.4)');
  radGrad.addColorStop(1, 'rgba(0, 0, 0, 0.7)');
  ctx.fillStyle = radGrad;
  ctx.fillRect(0, 0, width, height);
  ctx.restore();

  // Sort layers or render in order
  for (const layer of scene.layers) {
    if (layer.hidden) continue;
    renderLayer(ctx, layer, sceneMs, width, height, imageCache);
  }

  ctx.restore();
}

/**
 * Render an individual layer deterministically based on its effect & properties
 */
export function renderLayer(
  ctx: CanvasRenderingContext2D,
  layer: Layer,
  sceneMs: number,
  canvasWidth: number,
  canvasHeight: number,
  imageCache: ImageCache = globalImageCache
) {
  const { active, rawProgress, eased, relMs } = getEffectProgress(layer, sceneMs);

  // If layer hasn't appeared yet
  if (!active) {
    return;
  }

  ctx.save();

  // Base layer coordinates
  const lx = layer.x;
  const ly = layer.y;
  const lw = Math.max(10, layer.w);
  const lh = Math.max(10, layer.h);
  const cx = lx + lw / 2;
  const cy = ly + lh / 2;

  let opacity = layer.opacity !== undefined ? layer.opacity : 1.0;
  let rotation = layer.rotation || 0;
  let scaleX = 1.0;
  let scaleY = 1.0;
  let offsetX = 0;
  let offsetY = 0;

  const effect: EffectId = layer.effect;
  const cycleTime = 1400; // ms for continuous breathing
  const cycleProgress = (relMs % cycleTime) / cycleTime;

  // 1. Calculate transforms based on the specific effect
  switch (effect) {
    case 'pop-in': {
      const s = Math.max(0, eased);
      scaleX = s;
      scaleY = s;
      opacity *= Math.min(1, rawProgress * 3.5);
      break;
    }

    case 'slide-up': {
      offsetY = 180 * (1 - eased);
      opacity *= Math.min(1, rawProgress * 2.5);
      break;
    }

    case 'bounce-drop': {
      offsetY = -600 * (1 - eased);
      opacity *= Math.min(1, rawProgress * 4);
      break;
    }

    case 'elastic-snap': {
      // Rubber band stretch: wide then snaps
      const stretch = (1 - eased);
      scaleX = 1 + stretch * 0.45 * Math.cos(rawProgress * Math.PI * 4);
      scaleY = 1 - stretch * 0.35 * Math.sin(rawProgress * Math.PI * 4);
      opacity *= Math.min(1, rawProgress * 3);
      break;
    }

    case 'whoosh': {
      offsetX = -850 * (1 - eased);
      opacity *= Math.min(1, rawProgress * 5);
      break;
    }

    case 'fade': {
      offsetY = 30 * (1 - eased);
      opacity *= Math.min(1, rawProgress * 1.5);
      break;
    }

    case 'impact-shake': {
      // Dropping in and then vibrating upon landing
      if (rawProgress < 0.35) {
        offsetY = -280 * (1 - rawProgress / 0.35);
        opacity *= rawProgress / 0.35;
      } else {
        const shakeT = (rawProgress - 0.35) / 0.65;
        const decay = Math.exp(-shakeT * 5);
        offsetX = Math.sin(shakeT * 40) * 22 * decay;
        offsetY = Math.cos(shakeT * 32) * 16 * decay;
      }
      break;
    }

    case 'push-in': {
      const s = 1.9 - 0.9 * eased;
      scaleX = s;
      scaleY = s;
      opacity *= Math.min(1, rawProgress * 3);
      break;
    }

    case 'pan': {
      offsetX = Math.sin(eased * Math.PI) * 50;
      offsetY = Math.cos(eased * Math.PI) * 20 - 20;
      break;
    }

    case 'slide-card': {
      offsetX = 160 * (1 - eased);
      rotation += (1 - eased) * 6; // subtle dynamic tilt
      opacity *= Math.min(1, rawProgress * 2.5);
      break;
    }

    case 'flip-in': {
      // 3D perspective flip around Y axis
      const flipAngle = (1 - eased) * (Math.PI / 2);
      scaleX = Math.max(0.01, Math.cos(flipAngle));
      opacity *= Math.min(1, rawProgress * 2.5);
      break;
    }

    case 'zoom-to-line': {
      // Camera punch into layer line
      const punch = 1 + 0.35 * Math.sin(rawProgress * Math.PI);
      scaleX = punch;
      scaleY = punch;
      break;
    }

    case 'glow-pulse': {
      // Continuous neon breathing
      const pulse = Math.sin(cycleProgress * Math.PI * 2);
      const s = 1 + 0.04 * pulse;
      scaleX = s;
      scaleY = s;
      break;
    }

    case 'keyword-pulse': {
      // Periodic pulse on text
      const pulse = Math.sin(cycleProgress * Math.PI * 2);
      if (pulse > 0) {
        scaleX = 1 + pulse * 0.06;
        scaleY = 1 + pulse * 0.06;
      }
      break;
    }

    default:
      // Other text and marker effects handle their own internal drawing progression
      break;
  }

  // Apply matrix transforms
  ctx.globalAlpha = Math.max(0, Math.min(1, opacity));
  ctx.translate(cx + offsetX, cy + offsetY);
  if (rotation !== 0) {
    ctx.rotate((rotation * Math.PI) / 180);
  }
  ctx.scale(scaleX, scaleY);
  ctx.translate(-cx, -cy);

  // Render layer content based on LayerType
  switch (layer.type) {
    case 'text':
      renderTextLayer(ctx, layer, lx, ly, lw, lh, eased, rawProgress, relMs);
      break;
    case 'code':
      renderCodeLayer(ctx, layer, lx, ly, lw, lh, eased, rawProgress, relMs);
      break;
    case 'card':
      renderCardLayer(ctx, layer, lx, ly, lw, lh, eased, rawProgress, relMs);
      break;
    case 'image':
      renderImageLayer(ctx, layer, lx, ly, lw, lh, imageCache);
      break;
    case 'highlight':
      renderHighlightLayer(ctx, layer, lx, ly, lw, lh, eased, rawProgress);
      break;
  }

  // Draw attached Marker effects (if layer effect is marker type)
  renderMarkerEffects(ctx, layer, lx, ly, lw, lh, eased, rawProgress, relMs);

  ctx.restore();
}

/**
 * Text Layer Rendering
 */
function renderTextLayer(
  ctx: CanvasRenderingContext2D,
  layer: Layer,
  x: number,
  y: number,
  w: number,
  h: number,
  eased: number,
  rawProgress: number,
  relMs: number
) {
  const text = layer.text || 'Motion Text';
  const fontSize = layer.fontSize || 56;
  const color = layer.color || '#FFFFFF';
  const align = layer.textAlign || 'center';

  ctx.font = `700 ${fontSize}px 'Plus Jakarta Sans', system-ui, sans-serif`;
  ctx.textBaseline = 'middle';
  ctx.textAlign = align;

  const targetX = align === 'left' ? x : align === 'right' ? x + w : x + w / 2;
  const targetY = y + h / 2;

  // Background box if provided
  if (layer.bg && layer.bg !== 'transparent' && layer.bg !== '#00000000') {
    ctx.fillStyle = layer.bg;
    drawRoundRect(ctx, x, y, w, h, layer.borderRadius || 12);
    ctx.fill();
  }

  if (layer.effect === 'typewriter') {
    const totalChars = text.length;
    const revealedCount = Math.floor(rawProgress * totalChars);
    const visibleText = text.substring(0, revealedCount);

    ctx.fillStyle = color;
    ctx.fillText(visibleText, targetX, targetY);

    // Blinking cursor
    const showCursor = Math.floor((relMs / 250) % 2) === 0;
    if (showCursor && rawProgress < 1) {
      const textWidth = ctx.measureText(visibleText).width;
      const cursorX = align === 'left' ? targetX + textWidth + 4 :
                      align === 'center' ? targetX + textWidth / 2 + 4 :
                      targetX + 4;
      ctx.fillStyle = '#FFD54F';
      ctx.fillRect(cursorX, targetY - fontSize * 0.45, fontSize * 0.18, fontSize * 0.9);
    }
  } else if (layer.effect === 'counter-up') {
    // Detect numbers in text
    const match = text.match(/([^\d]*)([\d,.]+)([^\d]*)/);
    if (match) {
      const prefix = match[1] || '';
      const numStr = match[2].replace(/,/g, '');
      const suffix = match[3] || '';
      const targetNum = parseFloat(numStr) || 100;
      const currentNum = Math.round(targetNum * eased);
      const formatted = prefix + currentNum.toLocaleString() + suffix;

      ctx.fillStyle = color;
      ctx.fillText(formatted, targetX, targetY);
    } else {
      ctx.fillStyle = color;
      ctx.fillText(text, targetX, targetY);
    }
  } else if (layer.effect === 'word-reveal') {
    const words = text.split(' ');
    const count = words.length;
    const stagger = layer.stagger || 80;

    // Split words and draw with staggered cascade
    let lineTotalWidth = 0;
    const wordWidths = words.map((w) => {
      const measure = ctx.measureText(w + ' ').width;
      lineTotalWidth += measure;
      return measure;
    });

    let currentX = align === 'left' ? x : align === 'right' ? x + w - lineTotalWidth : x + (w - lineTotalWidth) / 2;

    words.forEach((word, idx) => {
      const wordStartMs = idx * stagger;
      const wordRelMs = Math.max(0, relMs - wordStartMs);
      const wordProgress = Math.min(1, wordRelMs / Math.max(1, (layer.durationMs * 0.6)));
      const wordEase = evaluateSpring('snappy', wordProgress);

      ctx.save();
      const wordYOffset = 30 * (1 - wordEase);
      ctx.globalAlpha = Math.min(1, wordProgress * 2.5);
      ctx.fillStyle = color;
      ctx.fillText(word, currentX, targetY + wordYOffset);
      ctx.restore();

      currentX += wordWidths[idx];
    });
  } else if (layer.effect === 'char-stagger-in') {
    const chars = Array.from(text);
    const count = chars.length;
    const stagger = layer.stagger || 25;

    let lineTotalWidth = 0;
    const charWidths = chars.map((ch) => {
      const measure = ctx.measureText(ch).width;
      lineTotalWidth += measure;
      return measure;
    });

    let currentX = align === 'left' ? x : align === 'right' ? x + w - lineTotalWidth : x + (w - lineTotalWidth) / 2;

    chars.forEach((char, idx) => {
      const charStartMs = idx * stagger;
      const charRelMs = Math.max(0, relMs - charStartMs);
      const charProgress = Math.min(1, charRelMs / Math.max(1, (layer.durationMs * 0.5)));
      const charEase = evaluateSpring('bouncy', charProgress);

      ctx.save();
      const charYOffset = -40 * (1 - charEase);
      ctx.globalAlpha = Math.min(1, charProgress * 3);
      ctx.fillStyle = color;
      ctx.fillText(char, currentX, targetY + charYOffset);
      ctx.restore();

      currentX += charWidths[idx];
    });
  } else if (layer.effect === 'keyword-pulse') {
    // Highlight keywords with yellow glow
    ctx.save();
    ctx.shadowColor = '#FFD54F';
    ctx.shadowBlur = 18;
    ctx.fillStyle = color;
    ctx.fillText(text, targetX, targetY);
    ctx.restore();
  } else {
    // Normal text rendering with optional glow if glow-pulse
    if (layer.effect === 'glow-pulse') {
      const pulse = (Math.sin((relMs / 300)) + 1) / 2;
      ctx.save();
      ctx.shadowColor = '#FFD54F';
      ctx.shadowBlur = 15 + pulse * 25;
      ctx.fillStyle = color;
      ctx.fillText(text, targetX, targetY);
      ctx.restore();
    } else {
      ctx.fillStyle = color;
      ctx.fillText(text, targetX, targetY);
    }
  }
}

/**
 * Code Editor / Terminal Window Rendering
 */
function renderCodeLayer(
  ctx: CanvasRenderingContext2D,
  layer: Layer,
  x: number,
  y: number,
  w: number,
  h: number,
  eased: number,
  rawProgress: number,
  relMs: number
) {
  const code = layer.code || layer.text || 'const hello = "world";';
  const lines = code.split('\n');
  const bg = layer.bg || '#111218';
  const radius = layer.borderRadius || 16;
  const fontSize = layer.fontSize || 32;

  // Window Container Card
  ctx.save();
  ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
  ctx.shadowBlur = 30;
  ctx.shadowOffsetY = 14;

  ctx.fillStyle = bg;
  drawRoundRect(ctx, x, y, w, h, radius);
  ctx.fill();

  // Thin border
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();

  // Window Titlebar Header
  const headerHeight = Math.max(44, fontSize * 1.3);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + headerHeight, radius);
  ctx.lineTo(x + w, y + headerHeight);
  ctx.lineTo(x, y + headerHeight);
  ctx.arcTo(x, y, x + radius, y, radius);
  ctx.closePath();
  ctx.fill();

  // Mac Window Chrome Dots
  const dotY = y + headerHeight / 2;
  const dotR = 6;
  // Red
  ctx.fillStyle = '#EF4444';
  ctx.beginPath();
  ctx.arc(x + 24, dotY, dotR, 0, Math.PI * 2);
  ctx.fill();
  // Yellow
  ctx.fillStyle = '#EAB308';
  ctx.beginPath();
  ctx.arc(x + 44, dotY, dotR, 0, Math.PI * 2);
  ctx.fill();
  // Green
  ctx.fillStyle = '#22C55E';
  ctx.beginPath();
  ctx.arc(x + 64, dotY, dotR, 0, Math.PI * 2);
  ctx.fill();

  // Window Title Tab
  ctx.fillStyle = '#94A3B8';
  ctx.font = `500 ${Math.max(16, fontSize * 0.45)}px 'Fira Code', monospace`;
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'center';
  ctx.fillText('motion.ts', x + w / 2, dotY);

  // Code Lines
  const contentY = y + headerHeight + 24;
  const lineHeight = fontSize * 1.55;
  const lineNumberGutter = x + 48;
  const codeStartX = x + 84;

  ctx.font = `500 ${fontSize}px 'Fira Code', ui-monospace, monospace`;
  ctx.textAlign = 'left';

  // Calculate typed progress for code-typewriter
  const totalChars = code.length;
  const revealedChars = layer.effect === 'code-typewriter' ? Math.floor(rawProgress * totalChars) : totalChars;
  let charCounter = 0;

  const targetHighlightLine = layer.highlightLine !== undefined ? layer.highlightLine : 2;

  lines.forEach((line, idx) => {
    const lineY = contentY + idx * lineHeight;
    if (lineY + lineHeight > y + h - 10) return; // clip overflow

    // Line Highlight effect or spotlight
    const isHighlighted = (layer.effect === 'line-highlight' || layer.effect === 'zoom-to-line') && idx + 1 === targetHighlightLine;

    if (isHighlighted) {
      ctx.save();
      ctx.fillStyle = 'rgba(255, 213, 79, 0.16)';
      drawRoundRect(ctx, x + 8, lineY - lineHeight * 0.35, w - 16, lineHeight, 8);
      ctx.fill();
      // Yellow bar on left
      ctx.fillStyle = '#FFD54F';
      ctx.fillRect(x + 8, lineY - lineHeight * 0.35, 4, lineHeight);
      ctx.restore();
    }

    // Line Number
    ctx.fillStyle = isHighlighted ? '#FFD54F' : 'rgba(148, 163, 184, 0.45)';
    ctx.fillText(`${idx + 1}`.padStart(2, ' '), lineNumberGutter - 12, lineY);

    // Code line syntax
    if (layer.effect === 'code-typewriter') {
      const lineLen = line.length + 1; // +1 for newline
      if (charCounter < revealedChars) {
        const charsForThisLine = Math.min(line.length, revealedChars - charCounter);
        drawSyntaxLine(ctx, line, codeStartX, lineY, lineHeight, charsForThisLine);

        // Caret if active line
        if (charCounter + charsForThisLine === revealedChars && rawProgress < 1) {
          const typedText = line.substring(0, charsForThisLine);
          const caretX = codeStartX + ctx.measureText(typedText).width + 2;
          ctx.fillStyle = '#FFD54F';
          ctx.fillRect(caretX, lineY - fontSize * 0.4, 3, fontSize * 0.9);
        }
      }
      charCounter += lineLen;
    } else {
      ctx.save();
      if ((layer.effect === 'line-highlight' || layer.effect === 'zoom-to-line') && !isHighlighted) {
        ctx.globalAlpha = 0.35; // Dim non-highlighted lines
      }
      drawSyntaxLine(ctx, line, codeStartX, lineY, lineHeight);
      ctx.restore();
    }
  });
}

/**
 * Card Container Rendering
 */
function renderCardLayer(
  ctx: CanvasRenderingContext2D,
  layer: Layer,
  x: number,
  y: number,
  w: number,
  h: number,
  eased: number,
  rawProgress: number,
  relMs: number
) {
  const bg = layer.bg || '#171821';
  const radius = layer.borderRadius || 24;

  ctx.save();
  ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
  ctx.shadowBlur = 24;
  ctx.shadowOffsetY = 10;

  ctx.fillStyle = bg;
  drawRoundRect(ctx, x, y, w, h, radius);
  ctx.fill();

  ctx.strokeStyle = layer.color || 'rgba(255, 213, 79, 0.25)';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();

  // If card has text, render it inside
  if (layer.text) {
    renderTextLayer(ctx, layer, x + 24, y + 24, w - 48, h - 48, eased, rawProgress, relMs);
  }
}

/**
 * Image Layer Rendering
 */
function renderImageLayer(
  ctx: CanvasRenderingContext2D,
  layer: Layer,
  x: number,
  y: number,
  w: number,
  h: number,
  imageCache: ImageCache
) {
  const radius = layer.borderRadius || 20;

  ctx.save();
  drawRoundRect(ctx, x, y, w, h, radius);
  ctx.clip();

  const img = layer.imageUrl ? imageCache.get(layer.imageUrl) : null;
  if (img) {
    ctx.drawImage(img, x, y, w, h);
  } else {
    // Stylized Dark Fallback Container
    const grad = ctx.createLinearGradient(x, y, x + w, y + h);
    grad.addColorStop(0, '#1E202B');
    grad.addColorStop(1, '#0F1018');
    ctx.fillStyle = grad;
    ctx.fillRect(x, y, w, h);

    // Decorative Icon / Label
    ctx.fillStyle = '#FFD54F';
    ctx.beginPath();
    ctx.arc(x + w / 2, y + h / 2 - 16, 28, 0, Math.PI * 2);
    ctx.strokeStyle = '#FFD54F';
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.font = '600 24px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('IMAGE ASSET', x + w / 2, y + h / 2 + 36);
  }

  ctx.restore();

  // Subtle border
  ctx.save();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.lineWidth = 2;
  drawRoundRect(ctx, x, y, w, h, radius);
  ctx.stroke();
  ctx.restore();
}

/**
 * Highlight Layer Rendering (Highlighter Ribbon)
 */
function renderHighlightLayer(
  ctx: CanvasRenderingContext2D,
  layer: Layer,
  x: number,
  y: number,
  w: number,
  h: number,
  eased: number,
  rawProgress: number
) {
  const sweepWidth = w * eased;
  const bg = layer.bg || 'rgba(255, 213, 79, 0.35)';

  ctx.save();
  ctx.fillStyle = bg;
  // Dynamic slanted edge
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + sweepWidth, y);
  ctx.lineTo(x + sweepWidth - 8, y + h);
  ctx.lineTo(x, y + h);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

/**
 * Marker and Annotation Drawing Effects
 */
function renderMarkerEffects(
  ctx: CanvasRenderingContext2D,
  layer: Layer,
  x: number,
  y: number,
  w: number,
  h: number,
  eased: number,
  rawProgress: number,
  relMs: number
) {
  const color = layer.color || '#FFD54F';

  switch (layer.effect) {
    case 'highlight-sweep': {
      // Sweeping marker over content
      const sweepW = w * eased;
      ctx.save();
      ctx.fillStyle = layer.bg || 'rgba(255, 213, 79, 0.32)';
      ctx.fillRect(x, y + h * 0.15, sweepW, h * 0.7);
      ctx.restore();
      break;
    }

    case 'underline-draw': {
      // Bold accent underline drawing from left to right
      const lineLen = w * eased;
      const lineY = y + h + 8;
      ctx.save();
      ctx.strokeStyle = color;
      ctx.lineWidth = 8;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(x, lineY);
      ctx.lineTo(x + lineLen, lineY);
      ctx.stroke();
      ctx.restore();
      break;
    }

    case 'circle-marker': {
      // Hand-drawn loop ellipse around layer
      const cx = x + w / 2;
      const cy = y + h / 2;
      const rx = w / 2 + 20;
      const ry = h / 2 + 14;

      ctx.save();
      ctx.strokeStyle = color;
      ctx.lineWidth = 5;
      ctx.lineCap = 'round';
      ctx.shadowColor = color;
      ctx.shadowBlur = 12;

      ctx.beginPath();
      const sweepAngle = eased * Math.PI * 2.15; // slightly over 360 for organic hand-drawn loop
      ctx.ellipse(cx, cy, rx, ry, -0.05, 0, sweepAngle);
      ctx.stroke();
      ctx.restore();
      break;
    }

    case 'box-marker': {
      // Bounding box perimeter sweep
      const pad = 12;
      const bx = x - pad;
      const by = y - pad;
      const bw = w + pad * 2;
      const bh = h + pad * 2;
      const perimeter = (bw + bh) * 2;
      const drawLen = perimeter * eased;

      ctx.save();
      ctx.strokeStyle = color;
      ctx.lineWidth = 5;
      ctx.setLineDash([drawLen, perimeter]);
      ctx.lineDashOffset = 0;
      drawRoundRect(ctx, bx, by, bw, bh, 14);
      ctx.stroke();
      ctx.restore();
      break;
    }

    case 'draw-arrow': {
      // Drawing arrow shaft + head
      const startX = x;
      const startY = y + h / 2;
      const endX = x + w;
      const endY = y + h / 2;

      const currentX = startX + (endX - startX) * eased;
      const currentY = startY + (endY - startY) * eased;

      ctx.save();
      ctx.strokeStyle = color;
      ctx.fillStyle = color;
      ctx.lineWidth = 8;
      ctx.lineCap = 'round';

      // Shaft
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.lineTo(currentX, currentY);
      ctx.stroke();

      // Arrowhead blooming at the end
      if (rawProgress > 0.6) {
        const headProgress = (rawProgress - 0.6) / 0.4;
        const headSize = 22 * evaluateSpring('snappy', headProgress);
        ctx.beginPath();
        ctx.moveTo(currentX, currentY);
        ctx.lineTo(currentX - headSize, currentY - headSize * 0.7);
        ctx.lineTo(currentX - headSize, currentY + headSize * 0.7);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();
      break;
    }

    case 'path-arrow': {
      // Curved bezier path arrow
      const p0 = { x: x, y: y + h };
      const p1 = { x: x + w * 0.3, y: y };
      const p2 = { x: x + w, y: y + h / 2 };

      ctx.save();
      ctx.strokeStyle = color;
      ctx.lineWidth = 6;
      ctx.lineCap = 'round';

      // Progressive quadratic curve
      ctx.beginPath();
      ctx.moveTo(p0.x, p0.y);
      for (let t = 0; t <= eased; t += 0.02) {
        const oneMinusT = 1 - t;
        const bx = oneMinusT * oneMinusT * p0.x + 2 * oneMinusT * t * p1.x + t * t * p2.x;
        const by = oneMinusT * oneMinusT * p0.y + 2 * oneMinusT * t * p1.y + t * t * p2.y;
        ctx.lineTo(bx, by);
      }
      ctx.stroke();

      // Traveling Beacon
      const oneMinusT = 1 - eased;
      const bx = oneMinusT * oneMinusT * p0.x + 2 * oneMinusT * eased * p1.x + eased * eased * p2.x;
      const by = oneMinusT * oneMinusT * p0.y + 2 * oneMinusT * eased * p1.y + eased * eased * p2.y;

      ctx.fillStyle = '#FFFFFF';
      ctx.shadowColor = color;
      ctx.shadowBlur = 18;
      ctx.beginPath();
      ctx.arc(bx, by, 9, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      break;
    }
  }
}

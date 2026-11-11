/**
 * GSAP-style Easing and Spring Functions
 * Deterministic: every value is a pure function of normalized progress t in [0, 1]
 */

import { EasingId, SpringProfile } from '../types';

export type EasingFn = (t: number) => number;

const c1 = 1.70158; // Standard GSAP / CSS back overshoot
const c2 = c1 * 1.525;
const c3 = c1 + 1;

// Bounce helpers
function bounceOut(t: number): number {
  const n1 = 7.5625;
  const d1 = 2.75;

  if (t < 1 / d1) {
    return n1 * t * t;
  } else if (t < 2 / d1) {
    const t2 = t - 1.5 / d1;
    return n1 * t2 * t2 + 0.75;
  } else if (t < 2.5 / d1) {
    const t2 = t - 2.25 / d1;
    return n1 * t2 * t2 + 0.9375;
  } else {
    const t2 = t - 2.625 / d1;
    return n1 * t2 * t2 + 0.984375;
  }
}

function bounceIn(t: number): number {
  return 1 - bounceOut(1 - t);
}

function bounceInOut(t: number): number {
  return t < 0.5
    ? (1 - bounceOut(1 - 2 * t)) / 2
    : (1 + bounceOut(2 * t - 1)) / 2;
}

export const EASING_FUNCTIONS: Record<EasingId, EasingFn> = {
  // Linear
  'linear': (t) => t,

  // Sine
  'sine.in': (t) => 1 - Math.cos((t * Math.PI) / 2),
  'sine.out': (t) => Math.sin((t * Math.PI) / 2),
  'sine.inOut': (t) => -(Math.cos(Math.PI * t) - 1) / 2,

  // Power 1 (Quad)
  'power1.in': (t) => t * t,
  'power1.out': (t) => 1 - (1 - t) * (1 - t),
  'power1.inOut': (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2),

  // Power 2 (Cubic)
  'power2.in': (t) => t * t * t,
  'power2.out': (t) => 1 - Math.pow(1 - t, 3),
  'power2.inOut': (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),

  // Power 3 (Quart)
  'power3.in': (t) => t * t * t * t,
  'power3.out': (t) => 1 - Math.pow(1 - t, 4),
  'power3.inOut': (t) => (t < 0.5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2),

  // Power 4 (Quint)
  'power4.in': (t) => t * t * t * t * t,
  'power4.out': (t) => 1 - Math.pow(1 - t, 5),
  'power4.inOut': (t) => (t < 0.5 ? 16 * t * t * t * t * t : 1 - Math.pow(-2 * t + 2, 5) / 2),

  // Expo
  'expo.in': (t) => (t === 0 ? 0 : Math.pow(2, 10 * t - 10)),
  'expo.out': (t) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t)),
  'expo.inOut': (t) => {
    if (t === 0) return 0;
    if (t === 1) return 1;
    return t < 0.5
      ? Math.pow(2, 20 * t - 10) / 2
      : (2 - Math.pow(2, -20 * t + 10)) / 2;
  },

  // Circ
  'circ.in': (t) => 1 - Math.sqrt(1 - Math.pow(t, 2)),
  'circ.out': (t) => Math.sqrt(1 - Math.pow(t - 1, 2)),
  'circ.inOut': (t) =>
    t < 0.5
      ? (1 - Math.sqrt(1 - Math.pow(2 * t, 2))) / 2
      : (Math.sqrt(1 - Math.pow(-2 * t + 2, 2)) + 1) / 2,

  // Back (Overshoot 1.70158)
  'back.in': (t) => c3 * t * t * t - c1 * t * t,
  'back.out': (t) => 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2),
  'back.inOut': (t) =>
    t < 0.5
      ? (Math.pow(2 * t, 2) * ((c2 + 1) * 2 * t - c2)) / 2
      : (Math.pow(2 * t - 2, 2) * ((c2 + 1) * (t * 2 - 2) + c2) + 2) / 2,

  // Elastic
  'elastic.in': (t) => {
    if (t === 0) return 0;
    if (t === 1) return 1;
    const c4 = (2 * Math.PI) / 3;
    return -Math.pow(2, 10 * t - 10) * Math.sin((t * 10 - 10.75) * c4);
  },
  'elastic.out': (t) => {
    if (t === 0) return 0;
    if (t === 1) return 1;
    const c4 = (2 * Math.PI) / 3;
    return Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
  },
  'elastic.inOut': (t) => {
    if (t === 0) return 0;
    if (t === 1) return 1;
    const c5 = (2 * Math.PI) / 4.5;
    return t < 0.5
      ? -(Math.pow(2, 20 * t - 10) * Math.sin((20 * t - 11.125) * c5)) / 2
      : (Math.pow(2, -20 * t + 10) * Math.sin((20 * t - 11.125) * c5)) / 2 + 1;
  },

  // Bounce
  'bounce.in': bounceIn,
  'bounce.out': bounceOut,
  'bounce.inOut': bounceInOut,
};

/**
 * Spring oscillator profiles
 * Computes exact damped oscillator position for normalized t in [0, 1]
 */
interface SpringParams {
  zeta: number; // Damping ratio
  omega: number; // Angular frequency (rad/sec normalized over the unit duration)
}

const SPRING_CONFIGS: Record<SpringProfile, SpringParams> = {
  smooth: { zeta: 0.95, omega: 11.0 },
  snappy: { zeta: 0.70, omega: 18.0 },
  bouncy: { zeta: 0.42, omega: 15.0 },
};

/**
 * Pure mathematical damped oscillator for springs:
 * y(t) = 1 - e^(-zeta * omega * t) * [ cos(omega_d * t) + (zeta / sqrt(1 - zeta^2)) * sin(omega_d * t) ]
 */
export function evaluateSpring(profile: SpringProfile, t: number): number {
  if (t <= 0) return 0;
  if (t >= 1) return 1;

  const { zeta, omega } = SPRING_CONFIGS[profile] || SPRING_CONFIGS.snappy;
  const omegaD = omega * Math.sqrt(Math.max(0.0001, 1 - zeta * zeta));
  const envelope = Math.exp(-zeta * omega * t);
  const oscillation = Math.cos(omegaD * t) + (zeta / Math.sqrt(1 - zeta * zeta)) * Math.sin(omegaD * t);

  return 1 - envelope * oscillation;
}

/**
 * General ease resolver
 */
export function evaluateEasing(easing: EasingId = 'power2.out', t: number): number {
  const clamped = Math.max(0, Math.min(1, t));
  const fn = EASING_FUNCTIONS[easing] || EASING_FUNCTIONS['power2.out'];
  return fn(clamped);
}

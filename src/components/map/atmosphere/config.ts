/**
 * Atmosphere / shattered-glass node tuning.
 *
 * One place to adjust the whole look. These are the values ported from the
 * standalone preview (scratch/glass-node-preview.html). Edit freely — the
 * scene reads from here at render time.
 */

import { MAP_CONFIG } from '@/lib/geo/index';

const R = MAP_CONFIG.radius; // globe radius (10)

export const ATMO = {
  /** Master fracture: one broken window every shard is cut from. */
  fracture: {
    seed: 7,
    depth: 0.32, // glass thickness, in normalized-shard units (shard radius ≈ 1)
    bevel: 0.06, // chamfered edge that catches light — the "real glass" tell
  },

  /** Per-shard glass material. */
  glass: {
    roughness: 0.02,  // crisp refraction
    frostRoughness: 0.62, // frosted when a shard is a weak match (low clarity)
    transmission: 1.0,
    thickness: 1.5,   // thick glass → the scene bends strongly through each shard
    ior: 1.55,
    clearcoat: 1.0,
    clearcoatRoughness: 0.06,
    tintStrength: 0.42, // lower = more see-through, so the backdrop bends through the glass
    envIntensity: 2.2, // reflections do most of the work (preview-lab glints)
    opacityMin: 0.7, // opacity of fully-frosted (unmatched) shards
    // colour a fully-frosted shard drifts toward (washed-out, cold)
    frostColor: '#8090a8',
    // uniform tone of the intact sheet; per-school type colours emerge on shatter
    monoColor: '#a8c2e0',
    // Subtle backlit glow so they read as lit stained glass (bloom catches it),
    // but kept low so reflection/refraction — not flat emissive — defines them.
    emissiveIntensity: 0.4,
    iridescence: 0.75, // chromatic shimmer at glancing angles (nod to the dither ref)
    iridescenceIor: 1.32,
  },

  /** Affinity → clarity: how strongly the user's intent resolves the scene. */
  clarity: {
    neutral: 0.6, // baseline clarity when intent = 0 (nothing narrowed)
  },

  /** Fog — thickens & cools with storminess. Tuned for camera ~30u, radius 10u. */
  fog: {
    colorCalm: '#101826',
    colorStorm: '#05070d',
    densityCalm: 0.004,
    densityStorm: 0.018,
  },

  /** Rain — world-space streaks, intensity follows storminess. */
  rain: {
    drops: 1200,
    range: R * 3.2, // vertical fall distance
    spread: R * 2.2, // horizontal box half-extent
    color: '#b3ccff',
    maxOpacity: 0.32,
  },

  /** Lightning — only fires when storminess is high. */
  lightning: {
    threshold: 0.55,
    chancePerFrame: 0.012, // scaled by storminess
    decay: 0.86,
  },

  /** Storminess derived from the closest application deadline (days away). */
  deadlineStorm: {
    urgentDays: 14, // <= → full storm
    soonDays: 30,
    approachingDays: 60,
  },

  /** Base renderer exposure (lightning briefly bumps it; storm dims it). */
  exposure: 1.05,

  /** The glass window — one SEAMLESS, INTACT sheet by default; shatters only as filters narrow it. */
  wall: {
    cameraZ: 22,       // locked frontal camera distance
    scale: 2.3,        // pane-space → world scale (fills the view)
    gap: 1.0,          // seamless — panes meet exactly, fusing into one sheet
    depth: 0,          // flat single pane, no depth spread
    tilt: 0,           // all panes coplanar & aligned → seams invisible
    glassDepth: 0.14,  // physical thickness of the glass
    bevel: 0,          // no chamfered edges → no visible cell outlines when intact
    fallDistance: 22,  // how far a broken pane flies before it's gone
    idleBob: 0,        // intact panes are still — no orbit/drift
    swayAmp: 0,        // no auto-sway around the glass
    breakLerp: 0.07,   // speed panes break away / reassemble
  },

  /** Program facets — a selected pane sub-fractures into one facet per program. */
  facets: {
    separation: 0.18,   // how far open facets spread from the pane centre (× facet centroid)
    zPop: 0.26,         // forward pop of opened facets (pane-normalized units)
    openLerp: 0.09,     // crack-open / reseal speed
    emissive: 0.7,      // facet glow while open
    crackOpacity: 0.07, // etched crack web on intact panes (program count at a glance)
  },

  /** Kinship light — related panes (same type / state / shared specializations). */
  kin: {
    glow: 1.1,          // emissive lift on kin panes while one is hovered/selected
    maxSiblings: 6,
  },

  /** Interactivity — the preview-lab feel: the wall answers the cursor. */
  interact: {
    parallaxYaw: 0.11,    // field yaw toward the cursor (rad)
    parallaxPitch: 0.06,  // field pitch toward the cursor (rad)
    followLerp: 0.055,    // how quickly the field eases after the cursor
    swayYawCalm: 0.025,   // idle sway so reflections keep sweeping the glass…
    swayYawStorm: 0.10,   // …faster & wider as the storm builds (preview-lab)
    swayPitchCalm: 0.012,
    swayPitchStorm: 0.05,
    rippleRadius: 2.6,    // world-space reach of the cursor ripple on the wall
    rippleLift: 0.55,     // z lift of panes under the cursor
    rippleTilt: 0.10,     // panes tip toward the cursor inside the ripple
    hoverEase: 0.12,      // per-pane hover ease-in (scale/tilt/glint)
    focusFrost: 0.55,     // non-focused panes frost/desaturate while one is focused
    frostEase: 0.06,
  },
} as const;

/** Storm rattle amplitude (world units) for a shard at a given clarity. */
export function rattleAmplitude(storminess: number, clarity: number): number {
  return storminess * (R * 0.0015 + (1 - clarity) * R * 0.004);
}

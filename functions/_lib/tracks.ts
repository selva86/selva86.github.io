// Server-side certification tracks manifest + eligibility computation.
//
// Generated at build time by _build/build_tracks_manifest.py from
// _build/tracks-source.json (hand-authored) + functions/_data/exercise-manifest.json
// (derived). Bundled into the function — no runtime fetch.
//
// The runtime exposes:
//   - getAllTracks() / getTrack(id)         : manifest access
//   - computeEligibility(solvedSet, track)  : pure progress calculation
//   - generatePublicId()                    : RST-YYYY-XXXXXX format
//   - getIssuer()                           : issuer metadata for Open Badges
//
// Eligibility model: a user is eligible when (solved exercises in track's
// hubs) / (total exercises in track's hubs) >= track.threshold (default 0.8).
// "Solved" means an `exercise_attempts` row exists with passed=1, regardless
// of when it was recorded (so backfilled anon solves count fully).

import tracksJson from "../_data/tracks.json";

export interface TrackSkill {
  name: string;
  level: string; // "Beginner" | "Intermediate" | "Advanced"
}

export interface TrackHub {
  slug: string;
  url: string;
  total: number;
}

export interface Track {
  id: string;
  name: string;
  tagline: string;
  description: string;
  color_primary: string;
  color_accent: string;
  icon: string;
  skills: TrackSkill[];
  threshold: number;
  xp_award: number;
  total_exercises: number;
  hubs: TrackHub[];
}

export interface Issuer {
  id: string;
  name: string;
  url: string;
  email: string;
  image: string;
  description: string;
}

interface ManifestShape {
  version: number;
  issuer: Issuer;
  threshold_default: number;
  xp_award: number;
  tracks: Track[];
}

const manifest = tracksJson as ManifestShape;

export function getAllTracks(): Track[] {
  return manifest.tracks;
}

export function getTrack(trackId: string): Track | null {
  return manifest.tracks.find(t => t.id === trackId) || null;
}

export function getIssuer(): Issuer {
  return manifest.issuer;
}

export interface TrackProgress {
  track: Track;
  solved: number;
  pct: number;          // 0..1 ratio of solved/total
  eligible: boolean;    // pct >= threshold
}

// Computes progress for a single track given a set of solved (hub, exercise)
// pairs encoded as "hub_slug/exercise_id" strings. The caller passes a Set
// for O(1) membership tests over what may be thousands of solves.
export function computeTrackProgress(
  track: Track, solvedByHub: Map<string, Set<string>>,
): TrackProgress {
  let solved = 0;
  for (const hub of track.hubs) {
    const ids = solvedByHub.get(hub.slug);
    if (!ids) continue;
    solved += ids.size;
  }
  const pct = track.total_exercises > 0 ? solved / track.total_exercises : 0;
  return {
    track,
    solved,
    pct,
    eligible: pct >= track.threshold,
  };
}

// Cryptographically-random 6-char base36 ID prefixed with year:
//   RST-2026-A7K3F9
// 36^6 = 2,176,782,336 IDs per year — collision probability negligible.
// Uses crypto.getRandomValues for unpredictability (don't want sequential
// IDs that leak total cert count).
export function generatePublicId(now?: Date): string {
  const d = now ?? new Date();
  const year = d.getUTCFullYear();
  const buf = new Uint8Array(6);
  crypto.getRandomValues(buf);
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let suffix = "";
  for (let i = 0; i < 6; i++) {
    suffix += alphabet[buf[i] % alphabet.length];
  }
  return `RST-${year}-${suffix}`;
}

// Validates a user-supplied public ID looks plausible before doing a DB query.
// Cheap defence against bad URLs and SQL noise.
export function isValidPublicId(id: string): boolean {
  return /^RST-\d{4}-[A-Z0-9]{6}$/.test(id);
}

import type * as THREE from 'three';

export function normalizeName(value: string) {
  return String(value).toLowerCase().replace(/[^a-z0-9]/g, '');
}

export function clipSearchVariants(animationId: string): string[] {
  const raw = [animationId, animationId.replace(/-/g, ''), animationId.replace(/-/g, '_')];
  const set = new Set<string>();
  for (const r of raw) {
    set.add(r);
    set.add(normalizeName(r));
  }
  return [...set].filter(Boolean);
}

const FALLBACK_CLIP_NAMES: Record<string, string[]> = {
  walk: ['walking', 'walkcycle', 'walk_cycle'],
  sprint: ['run', 'running', 'jog'],
  idle: ['standing', 'stand', 'breathing'],
  sit: ['sitting', 'seated', 'chair'],
  'pick-up': ['pickup', 'pick', 'grab', 'take'],
  'emote-yes': ['emoteyes', 'yes', 'nod', 'thumbsup'],
  'emote-no': ['emoteno', 'no', 'shake', 'headshake'],
  'interact-right': ['interactright', 'useright', 'use_right'],
  'interact-left': ['interactleft', 'useleft', 'use_left'],
};

export function clipSearchVariantsWithFallback(animationId: string): string[] {
  const base = clipSearchVariants(animationId);
  const extra = FALLBACK_CLIP_NAMES[animationId] ?? [];
  return [...base, ...extra];
}

export function findAnimationAction(
  actions: Record<string, THREE.AnimationAction | null | undefined>,
  names: string[],
  candidates: string[]
) {
  const normalizedCandidates = candidates.map(normalizeName);

  for (const name of names) {
    if (normalizedCandidates.includes(normalizeName(name))) {
      return actions[name];
    }
  }

  for (const name of names) {
    const normalized = normalizeName(name);
    if (normalizedCandidates.some((candidate) => normalized.includes(candidate))) {
      return actions[name];
    }
  }

  return actions[names[0]] || null;
}

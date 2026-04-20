export type SceneBounds = {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
};

export function createRandomTarget(bounds: SceneBounds, currentPosition?: { x: number; z: number }, minDistance = 1.2) {
  const padding = 0.35;
  const minX = bounds.minX + padding;
  const maxX = bounds.maxX - padding;
  const minZ = bounds.minZ + padding;
  const maxZ = bounds.maxZ - padding;

  let x = randomBetween(minX, maxX);
  let z = randomBetween(minZ, maxZ);

  if (currentPosition) {
    let attempts = 0;
    while (distance2D(currentPosition.x, currentPosition.z, x, z) < minDistance && attempts < 12) {
      x = randomBetween(minX, maxX);
      z = randomBetween(minZ, maxZ);
      attempts += 1;
    }
  }

  return { x, z };
}

export function clampPosition(position: { x: number; z: number }, bounds: SceneBounds) {
  position.x = Math.max(bounds.minX, Math.min(bounds.maxX, position.x));
  position.z = Math.max(bounds.minZ, Math.min(bounds.maxZ, position.z));
}

export function lerpAngle(start: number, end: number, alpha: number) {
  const delta = ((((end - start) % (Math.PI * 2)) + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
  return start + delta * alpha;
}

export function randomBetween(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

export function distance2D(ax: number, az: number, bx: number, bz: number) {
  const dx = bx - ax;
  const dz = bz - az;
  return Math.sqrt(dx * dx + dz * dz);
}

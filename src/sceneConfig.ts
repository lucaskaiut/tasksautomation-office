export const ROOM = { width: 18, depth: 12 };

export const SCENE_CONFIG = {
  room: ROOM,
  camera: {
    position: [0, 7.1, -12.4] as [number, number, number],
    target: [0, 0.35, 0] as [number, number, number],
    fov: 45,
    minDistance: 7,
    maxDistance: 22,
    maxPolarAngle: Math.PI / 2.02,
  },
  actor: {
    speed: 1.1,
    rotationLerp: 8,
    bounds: {
      minX: -ROOM.width / 2,
      maxX: ROOM.width / 2,
      minZ: -ROOM.depth / 2,
      maxZ: ROOM.depth / 2,
    },
    startPosition: [0, 0, 0] as [number, number, number],
    scale: 0.6,
  },
};

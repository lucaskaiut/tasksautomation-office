export type OfficeFurnitureKind = 'desk' | 'sofa';

export type OfficeFurnitureCollider = {
  size: [number, number];
  offset?: [number, number];
};

export type OfficeFurniturePiece = {
  id: string;
  kind: OfficeFurnitureKind;
  position: [number, number, number];
  rotation?: [number, number, number];
  ownerActorId?: string | null;
  modelUrl?: string;
  scale?: number;
  collider?: OfficeFurnitureCollider;
};

export const OFFICE_FURNITURE: OfficeFurniturePiece[] = [
  { id: 'desk-left-near', kind: 'desk', position: [-5.2, 0, -2.6], ownerActorId: 'analysis' },
  { id: 'desk-left-far', kind: 'desk', position: [-5.2, 0, 2.6], ownerActorId: 'implementation:frontend' },
  {
    id: 'desk-right-near',
    kind: 'desk',
    position: [5.2, 0, -2.6],
    rotation: [0, Math.PI, 0],
    ownerActorId: 'implementation:backend',
  },
  { id: 'desk-right-far', kind: 'desk', position: [5.2, 0, 2.6], rotation: [0, Math.PI, 0] },
  {
    id: 'sofa-idle-lounge',
    kind: 'sofa',
    position: [-5.45, 0, 3.8],
    rotation: [0, Math.PI, 0],
    modelUrl: '/models/furnitures/loungeDesignSofa.glb',
    scale: 2.7,
    collider: { size: [3.4, 1], offset: [0, 0] },
  },
];

export type FurnitureCollisionRect = {
  furnitureId: string;
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
};

export function getFurnitureCollisionRects(padding = 0): FurnitureCollisionRect[] {
  return OFFICE_FURNITURE.flatMap((piece) => {
    if (!piece.collider) return [];
    const [width, depth] = piece.collider.size;
    const [offsetX, offsetZ] = piece.collider.offset ?? [0, 0];
    const centerX = piece.position[0] + offsetX;
    const centerZ = piece.position[2] + offsetZ;

    return [
      {
        furnitureId: piece.id,
        minX: centerX - width / 2 - padding,
        maxX: centerX + width / 2 + padding,
        minZ: centerZ - depth / 2 - padding,
        maxZ: centerZ + depth / 2 + padding,
      },
    ];
  });
}

export function isPointBlockedByFurniture(x: number, z: number, padding = 0) {
  return getFurnitureCollisionRects(padding).some(
    (rect) => x >= rect.minX && x <= rect.maxX && z >= rect.minZ && z <= rect.maxZ
  );
}

export function resolveFurnitureCollision(
  next: { x: number; z: number },
  previous: { x: number; z: number },
  padding = 0
) {
  const resolved = { ...next };

  for (let pass = 0; pass < 4; pass += 1) {
    let collided = false;

    for (const rect of getFurnitureCollisionRects(padding)) {
      const insideX = resolved.x >= rect.minX && resolved.x <= rect.maxX;
      const insideZ = resolved.z >= rect.minZ && resolved.z <= rect.maxZ;
      if (!insideX || !insideZ) continue;

      collided = true;

      const pushLeft = Math.abs(resolved.x - rect.minX);
      const pushRight = Math.abs(rect.maxX - resolved.x);
      const pushUp = Math.abs(resolved.z - rect.minZ);
      const pushDown = Math.abs(rect.maxZ - resolved.z);
      const minPush = Math.min(pushLeft, pushRight, pushUp, pushDown);

      if (minPush === pushLeft) {
        resolved.x = rect.minX;
      } else if (minPush === pushRight) {
        resolved.x = rect.maxX;
      } else if (minPush === pushUp) {
        resolved.z = rect.minZ;
      } else {
        resolved.z = rect.maxZ;
      }

      if (Math.abs(next.x - previous.x) >= Math.abs(next.z - previous.z)) {
        if (previous.x < rect.minX) resolved.x = rect.minX;
        if (previous.x > rect.maxX) resolved.x = rect.maxX;
      } else {
        if (previous.z < rect.minZ) resolved.z = rect.minZ;
        if (previous.z > rect.maxZ) resolved.z = rect.maxZ;
      }
    }

    if (!collided) break;
  }

  return resolved;
}

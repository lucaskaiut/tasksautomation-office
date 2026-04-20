import { Html } from '@react-three/drei';
import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OFFICE_ACTOR_DEFINITIONS } from './officeActorDefinitions';

export type DeskFurnitureProps = {
  furnitureId: string;
  position: [number, number, number];
  rotation?: [number, number, number];
  ownerActorId?: string | null;
};

function ownerDisplayLabel(ownerActorId: string) {
  return OFFICE_ACTOR_DEFINITIONS.find((a) => a.id === ownerActorId)?.name ?? ownerActorId;
}

export function DeskFurniture({ furnitureId, position, rotation = [0, 0, 0], ownerActorId }: DeskFurnitureProps) {
  const groupRef = useRef<THREE.Group>(null);
  const owner = ownerActorId ?? null;
  const topColor = owner ? '#5a6578' : '#52525b';

  useEffect(() => {
    const g = groupRef.current;
    if (!g) return;
    g.userData.furnitureId = furnitureId;
    g.userData.kind = 'desk';
    g.userData.ownerActorId = owner;
  }, [furnitureId, owner]);

  return (
    <group ref={groupRef} position={position} rotation={rotation}>
      <mesh castShadow receiveShadow position={[0, 0.75, 0]}>
        <boxGeometry args={[1.6, 0.08, 0.9]} />
        <meshStandardMaterial color={topColor} roughness={0.82} metalness={0.06} />
      </mesh>
      <mesh castShadow position={[-0.65, 0.35, -0.3]}>
        <boxGeometry args={[0.08, 0.7, 0.08]} />
        <meshStandardMaterial color="#71717a" />
      </mesh>
      <mesh castShadow position={[0.65, 0.35, -0.3]}>
        <boxGeometry args={[0.08, 0.7, 0.08]} />
        <meshStandardMaterial color="#71717a" />
      </mesh>
      <mesh castShadow position={[-0.65, 0.35, 0.3]}>
        <boxGeometry args={[0.08, 0.7, 0.08]} />
        <meshStandardMaterial color="#71717a" />
      </mesh>
      <mesh castShadow position={[0.65, 0.35, 0.3]}>
        <boxGeometry args={[0.08, 0.7, 0.08]} />
        <meshStandardMaterial color="#71717a" />
      </mesh>
      <mesh castShadow position={[0, 1.12, 0]}>
        <boxGeometry args={[0.6, 0.35, 0.05]} />
        <meshStandardMaterial color="#111827" />
      </mesh>
      {owner ? (
        <Html position={[0, 1.02, 0.52]} center style={{ pointerEvents: 'none' }}>
          <div
            style={{
              padding: '2px 8px',
              borderRadius: 4,
              fontSize: 10,
              fontWeight: 600,
              color: '#f8fafc',
              background: 'rgba(15, 23, 42, 0.88)',
              border: '1px solid rgba(148, 163, 184, 0.45)',
              whiteSpace: 'nowrap',
              maxWidth: 140,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
            title={owner}
          >
            {ownerDisplayLabel(owner)}
          </div>
        </Html>
      ) : null}
    </group>
  );
}

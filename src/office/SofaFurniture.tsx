import { useGLTF } from '@react-three/drei';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';

export type SofaFurnitureProps = {
  furnitureId: string;
  modelUrl: string;
  position: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
};

export function SofaFurniture({
  furnitureId,
  modelUrl,
  position,
  rotation = [0, 0, 0],
  scale = 1,
}: SofaFurnitureProps) {
  const rootRef = useRef<THREE.Group>(null);
  const { scene } = useGLTF(modelUrl);
  const clonedScene = useMemo(() => scene.clone(), [scene]);

  useEffect(() => {
    clonedScene.traverse((child) => {
      if (!(child instanceof THREE.Mesh)) return;
      child.castShadow = true;
      child.receiveShadow = true;
    });
  }, [clonedScene]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    root.userData.furnitureId = furnitureId;
    root.userData.kind = 'sofa';
  }, [furnitureId]);

  return (
    <group ref={rootRef} position={position} rotation={rotation} scale={scale}>
      <primitive object={clonedScene} />
    </group>
  );
}

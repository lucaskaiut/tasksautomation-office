import { Suspense, useLayoutEffect, useRef, type RefObject } from 'react';
import * as THREE from 'three';
import { Canvas, useThree } from '@react-three/fiber';
import { Environment, OrbitControls, PerspectiveCamera } from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { ActorControlPanel } from './components/ActorControlPanel';
import { ActorRuntimeProvider } from './office/ActorRuntimeProvider';
import { buildInitialActorRuntime, OFFICE_ACTOR_DEFINITIONS } from './office/officeActorDefinitions';
import { DeskFurniture } from './office/DeskFurniture';
import { OFFICE_FURNITURE } from './office/officeFurniture';
import { OfficeActor } from './office/OfficeActor';
import { SofaFurniture } from './office/SofaFurniture';
import { SCENE_CONFIG } from './sceneConfig';
import { TasksRealtimeBridge } from './realtime/TasksRealtimeBridge';

function App() {
  const orbitRef = useRef<OrbitControlsImpl | null>(null);

  return (
    <ActorRuntimeProvider initialActors={buildInitialActorRuntime('sit')}>
      <div className="office-layout">
        <aside className="office-sidebar">
          <ActorControlPanel />
        </aside>
        <div className="office-canvas-host">
          <TasksRealtimeBridge />
          <Canvas style={{ position: 'absolute', inset: 0 }} shadows gl={{ antialias: true }}>
            <PerspectiveCamera
              makeDefault
              fov={SCENE_CONFIG.camera.fov}
              position={SCENE_CONFIG.camera.position}
            />

            <color attach="background" args={["#0a0a0a"]} />
            <fog attach="fog" args={['#0a0a0a', 28, 78]} />

            <ambientLight intensity={6.2} />
            <hemisphereLight args={['#dce4f2', '#5c6575', 1.35]} />
            <directionalLight
              castShadow
              intensity={2.85}
              position={[6, 10, 4]}
              shadow-mapSize-width={2048}
              shadow-mapSize-height={2048}
            />
            <directionalLight position={[0, 9, 18]} intensity={4.9} castShadow={false}>
              <object3D attach="target" position={[0, 0.35, 0]} />
            </directionalLight>

            <Suspense fallback={null}>
              <Environment preset="city" environmentIntensity={1.12} />
              <OfficeStage />
              {OFFICE_ACTOR_DEFINITIONS.map((def) => (
                <OfficeActor
                  key={def.id}
                  actorId={def.id}
                  name={def.name}
                  character={def.character}
                  spawnPosition={def.spawnPosition}
                  spawnRotation={def.spawnRotation}
                />
              ))}
            </Suspense>

            <OrbitControls
              ref={orbitRef}
              enablePan={false}
              target={SCENE_CONFIG.camera.target}
              maxPolarAngle={SCENE_CONFIG.camera.maxPolarAngle}
              minDistance={SCENE_CONFIG.camera.minDistance}
              maxDistance={SCENE_CONFIG.camera.maxDistance}
            />
            <SyncOrbitCamera orbitRef={orbitRef} />
          </Canvas>
        </div>
      </div>
    </ActorRuntimeProvider>
  );
}

function SyncOrbitCamera({ orbitRef }: { orbitRef: RefObject<OrbitControlsImpl | null> }) {
  const camera = useThree((s) => s.camera);
  const { position, target } = SCENE_CONFIG.camera;

  useLayoutEffect(() => {
    const apply = () => {
      camera.position.set(position[0], position[1], position[2]);
      const ctrl = orbitRef.current;
      if (ctrl) {
        ctrl.target.set(target[0], target[1], target[2]);
        ctrl.update();
      }
    };
    apply();
    const id = requestAnimationFrame(apply);
    return () => cancelAnimationFrame(id);
  }, [camera, orbitRef, position, target]);

  return null;
}

function OfficeStage() {
  const { minX, maxX, minZ, maxZ } = SCENE_CONFIG.actor.bounds;
  const width = maxX - minX;
  const depth = maxZ - minZ;

  return (
    <group>
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[SCENE_CONFIG.room.width, SCENE_CONFIG.room.depth]} />
        <meshStandardMaterial color="#1f2937" />
      </mesh>

      <mesh receiveShadow position={[0, -0.001, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[width, depth]} />
        <meshStandardMaterial color="#334155" transparent opacity={0.35} />
      </mesh>

      <RoomWalls />

      <BoundsFrame />

      {OFFICE_FURNITURE.filter((piece) => piece.kind === 'desk').map((desk) => (
        <DeskFurniture
          key={desk.id}
          furnitureId={desk.id}
          position={desk.position}
          rotation={desk.rotation}
          ownerActorId={desk.ownerActorId}
        />
      ))}

      {OFFICE_FURNITURE.filter((piece) => piece.kind === 'sofa').map((sofa) => (
        <SofaFurniture
          key={sofa.id}
          furnitureId={sofa.id}
          modelUrl={sofa.modelUrl || '/models/furnitures/loungeDesignSofa.glb'}
          position={sofa.position}
          rotation={sofa.rotation}
          scale={sofa.scale}
        />
      ))}
    </group>
  );
}

function RoomWalls() {
  const floorW = SCENE_CONFIG.room.width;
  const floorD = SCENE_CONFIG.room.depth;
  const halfW = floorW / 2;
  const halfD = floorD / 2;
  const wallH = 4.6;
  const wallT = 0.14;
  const y = wallH / 2;

  return (
    <group>
      <mesh castShadow receiveShadow position={[0, y, halfD + wallT / 2]}>
        <boxGeometry args={[floorW, wallH, wallT]} />
        <meshStandardMaterial color="#3d4a5c" roughness={0.88} metalness={0.04} />
      </mesh>
      <mesh castShadow receiveShadow position={[halfW + wallT / 2, y, 0]}>
        <boxGeometry args={[wallT, wallH, floorD]} />
        <meshStandardMaterial color="#3d4a5c" roughness={0.88} metalness={0.04} />
      </mesh>
      <mesh castShadow receiveShadow position={[-halfW - wallT / 2, y, 0]}>
        <boxGeometry args={[wallT, wallH, floorD]} />
        <meshStandardMaterial color="#3d4a5c" roughness={0.88} metalness={0.04} />
      </mesh>
    </group>
  );
}

function BoundsFrame() {
  const { minX, maxX, minZ, maxZ } = SCENE_CONFIG.actor.bounds;
  const width = maxX - minX;
  const depth = maxZ - minZ;
  const centerX = (minX + maxX) / 2;
  const centerZ = (minZ + maxZ) / 2;

  return (
    <group position={[centerX, 0.03, centerZ]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[Math.min(width, depth) * 0.47, Math.min(width, depth) * 0.5, 4]} />
        <meshStandardMaterial color="#94a3b8" transparent opacity={0.35} />
      </mesh>

      <lineSegments>
        <edgesGeometry args={[new THREE.BoxGeometry(width, 0.02, depth)]} />
        <lineBasicMaterial color="#cbd5e1" />
      </lineSegments>
    </group>
  );
}

export default App;

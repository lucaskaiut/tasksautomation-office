import { Suspense, useLayoutEffect, useMemo, useRef, useState, type RefObject } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Environment, OrbitControls, PerspectiveCamera } from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { ActorControlPanel } from './components/ActorControlPanel';
import { ActorRuntimeProvider } from './office/ActorRuntimeProvider';
import { SceneActorRegistryProvider } from './office/SceneActorRegistry';
import { buildInitialActorRuntime, OFFICE_ACTOR_DEFINITIONS } from './office/officeActorDefinitions';
import { DeskFurniture } from './office/DeskFurniture';
import { OFFICE_FURNITURE } from './office/officeFurniture';
import { OfficeActor } from './office/OfficeActor';
import { SofaFurniture } from './office/SofaFurniture';
import { PetActor } from './office/PetActor';
import { PET_DEFINITIONS, PET_STATIONS } from './office/petDefinitions';
import { SCENE_CONFIG } from './sceneConfig';
import { TasksRealtimeBridge } from './realtime/TasksRealtimeBridge';

const WORKER_ACTOR_IDS = OFFICE_ACTOR_DEFINITIONS.map((definition) => definition.id);

function App() {
  const orbitRef = useRef<OrbitControlsImpl | null>(null);
  const [cameraPosition, setCameraPosition] = useState<[number, number, number] | null>(null);
  const isDev = import.meta.env.DEV;

  return (
    <ActorRuntimeProvider initialActors={buildInitialActorRuntime('idle')}>
      <SceneActorRegistryProvider>
        <div className="office-layout">
          <aside className="office-sidebar">
            <ActorControlPanel />
          </aside>
          <div className="office-canvas-host">
            <TasksRealtimeBridge />
            {isDev ? <DebugHud cameraPosition={cameraPosition} /> : null}
            <Canvas style={{ position: 'absolute', inset: 0 }} shadows gl={{ antialias: true }}>
              <PerspectiveCamera
                makeDefault
                fov={SCENE_CONFIG.camera.fov}
                position={SCENE_CONFIG.camera.position}
              />

              <color attach="background" args={["#0a0a0a"]} />
              <fog attach="fog" args={['#0a0a0a', 28, 78]} />

              {isDev ? <CameraDebugReporter onPosition={setCameraPosition} /> : null}

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
                {PET_DEFINITIONS.map((pet) => (
                  <PetActor key={pet.id} pet={pet} stations={PET_STATIONS} actorIds={WORKER_ACTOR_IDS} />
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
      </SceneActorRegistryProvider>
    </ActorRuntimeProvider>
  );
}

function DebugHud({ cameraPosition }: { cameraPosition: [number, number, number] | null }) {
  const fmt = (n: number) => n.toFixed(2);

  return (
    <div className="office-debug-hud" role="status" aria-label="Debug">
      <div className="office-debug-hud__title">Debug</div>
      <div className="office-debug-hud__row">
        <span className="office-debug-hud__label">Camera</span>
        <span className="office-debug-hud__value">
          {cameraPosition ? `x=${fmt(cameraPosition[0])} y=${fmt(cameraPosition[1])} z=${fmt(cameraPosition[2])}` : '—'}
        </span>
      </div>
    </div>
  );
}

function CameraDebugReporter({
  onPosition,
}: {
  onPosition: (pos: [number, number, number]) => void;
}) {
  const camera = useThree((s) => s.camera);
  const lastSentAt = useRef(0);
  const lastSent = useRef<[number, number, number] | null>(null);

  useFrame(({ clock }) => {
    const now = clock.getElapsedTime();
    if (now - lastSentAt.current < 0.1) return;

    const p: [number, number, number] = [camera.position.x, camera.position.y, camera.position.z];
    const prev = lastSent.current;
    if (prev && prev[0] === p[0] && prev[1] === p[1] && prev[2] === p[2]) return;

    lastSentAt.current = now;
    lastSent.current = p;
    onPosition(p);
  });

  return null;
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

      {PET_STATIONS.map((station) => (
        <PetStationMarker key={station.id} kind={station.kind} position={station.position} />
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
  const triLowH = 1.25;
  const y = wallH / 2;

  return (
    <group>
      <mesh castShadow receiveShadow position={[0, y, halfD + wallT / 2]}>
        <boxGeometry args={[floorW, wallH, wallT]} />
        <meshStandardMaterial color="#3d4a5c" roughness={0.88} metalness={0.04} />
      </mesh>
      <CornerCutWall
        width={floorW}
        highHeight={wallH}
        lowHeight={triLowH}
        thickness={wallT}
        z={-halfD - wallT / 2}
        apexSide="right"
      />
      <CornerCutSideWall
        depth={floorD}
        highHeight={wallH}
        lowHeight={triLowH}
        thickness={wallT}
        x={halfW + wallT / 2}
        apexSide="far"
      />
      <mesh castShadow receiveShadow position={[-halfW - wallT / 2, y, 0]}>
        <boxGeometry args={[wallT, wallH, floorD]} />
        <meshStandardMaterial color="#3d4a5c" roughness={0.88} metalness={0.04} />
      </mesh>
    </group>
  );
}

function CornerCutWall({
  width,
  highHeight,
  lowHeight,
  thickness,
  z,
  apexSide,
}: {
  width: number;
  highHeight: number;
  lowHeight: number;
  thickness: number;
  z: number;
  apexSide: 'left' | 'right';
}) {
  const geometry = useMemo(() => {
    const halfW = width / 2;
    const shape = new THREE.Shape();
    shape.moveTo(-halfW, 0);
    shape.lineTo(-halfW, apexSide === 'left' ? lowHeight : highHeight);
    shape.lineTo(halfW, apexSide === 'left' ? highHeight : lowHeight);
    shape.lineTo(halfW, 0);
    shape.lineTo(-halfW, 0);

    const g = new THREE.ExtrudeGeometry(shape, { depth: thickness, bevelEnabled: false });
    g.translate(0, 0, -thickness / 2);
    return g;
  }, [width, highHeight, lowHeight, thickness, apexSide]);

  return (
    <mesh castShadow receiveShadow position={[0, 0, z]} geometry={geometry}>
      <meshStandardMaterial color="#3d4a5c" roughness={0.88} metalness={0.04} side={THREE.DoubleSide} />
    </mesh>
  );
}

function CornerCutSideWall({
  depth,
  highHeight,
  lowHeight,
  thickness,
  x,
  apexSide,
}: {
  depth: number;
  highHeight: number;
  lowHeight: number;
  thickness: number;
  x: number;
  apexSide: 'near' | 'far';
}) {
  const geometry = useMemo(() => {
    const halfD = depth / 2;
    const shape = new THREE.Shape();
    shape.moveTo(-halfD, 0);
    shape.lineTo(-halfD, apexSide === 'near' ? lowHeight : highHeight);
    shape.lineTo(halfD, apexSide === 'near' ? highHeight : lowHeight);
    shape.lineTo(halfD, 0);
    shape.lineTo(-halfD, 0);

    const g = new THREE.ExtrudeGeometry(shape, { depth: thickness, bevelEnabled: false });
    g.translate(0, 0, -thickness / 2);
    g.rotateY(Math.PI / 2);
    return g;
  }, [depth, highHeight, lowHeight, thickness, apexSide]);

  return (
    <mesh castShadow receiveShadow position={[x, 0, 0]} geometry={geometry}>
      <meshStandardMaterial color="#3d4a5c" roughness={0.88} metalness={0.04} side={THREE.DoubleSide} />
    </mesh>
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

function PetStationMarker({
  kind,
  position,
}: {
  kind: 'food' | 'water';
  position: [number, number, number];
}) {
  const color = kind === 'food' ? '#f59e0b' : '#38bdf8';

  return (
    <group position={position}>
      <mesh castShadow receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.28, 0.33, 0.09, 20]} />
        <meshStandardMaterial color="#475569" roughness={0.78} metalness={0.2} />
      </mesh>
      <mesh position={[0, 0.045, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.18, 0.18, 0.03, 20]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.2} />
      </mesh>
    </group>
  );
}

export default App;

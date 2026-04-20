import { Html, useAnimations, useGLTF } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef, useState, type MutableRefObject } from 'react';
import * as THREE from 'three';
import { SCENE_CONFIG } from '../sceneConfig';
import { clipSearchVariantsWithFallback, findAnimationAction } from './animationResolve';
import { useSceneActorRegistry } from './SceneActorRegistry';
import { clampPosition, createRandomTarget, lerpAngle, randomBetween } from './motion';
import type { PetDefinition, PetStation } from './petDefinitions';
import { resolveCharacterModelUrl } from './officeActorDefinitions';

type PetActionKind = 'eat' | 'wander' | 'ask-for-petting';
type PetActionPhase = 'moving' | 'holding';

type PetActionState = {
  kind: PetActionKind;
  phase: PetActionPhase;
  endsAt: number;
  label: string;
  target: { x: number; z: number };
  stationId?: string;
  actorId?: string;
};

const PET_ACTIONS: PetActionKind[] = ['eat', 'wander', 'ask-for-petting'];
const PET_WALK_ANIMATION_ID = 'walk';
const PET_EAT_ANIMATION_ID = 'eat';
const PET_PETTING_ANIMATION_ID = 'sit';

export function PetActor({
  pet,
  stations,
  actorIds,
}: {
  pet: PetDefinition;
  stations: PetStation[];
  actorIds: string[];
}) {
  const [resolvedModelUrl, setResolvedModelUrl] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function resolveUrl() {
      const primaryUrl = resolveCharacterModelUrl(pet.character);
      try {
        const response = await fetch(primaryUrl, { method: 'HEAD' });
        if (active && response.ok) {
          setResolvedModelUrl(primaryUrl);
          return;
        }
      } catch {
        // Falls back to the backup model when the pet asset is not available locally.
      }

      if (active) {
        setResolvedModelUrl(resolveCharacterModelUrl(pet.fallbackCharacter));
      }
    }

    void resolveUrl();

    return () => {
      active = false;
    };
  }, [pet.character, pet.fallbackCharacter]);

  if (!resolvedModelUrl) return null;

  return <LoadedPetActor pet={pet} stations={stations} actorIds={actorIds} modelUrl={resolvedModelUrl} />;
}

function LoadedPetActor({
  pet,
  stations,
  actorIds,
  modelUrl,
}: {
  pet: PetDefinition;
  stations: PetStation[];
  actorIds: string[];
  modelUrl: string;
}) {
  const [animationId, setAnimationId] = useState<string>(PET_WALK_ANIMATION_ID);
  const [currentActionLabel, setCurrentActionLabel] = useState('Passeando');
  const actionRef = useRef<PetActionState | null>(null);
  const rootRef = useRef<THREE.Group>(null);
  const skinRef = useRef<THREE.Object3D>(null);
  const lastAnimationRef = useRef<string | null>(null);
  const { getActorPosition } = useSceneActorRegistry();

  const { scene, animations } = useGLTF(modelUrl);
  const clonedScene = useMemo(() => scene.clone(), [scene]);
  const { actions, names } = useAnimations(animations, skinRef);

  useEffect(() => {
    if (!actions || !names?.length) return;

    const candidates = clipSearchVariantsWithFallback(animationId);
    const clipAction = findAnimationAction(actions, names, candidates);
    if (!clipAction) return;

    clipAction.reset().fadeIn(0.25).play();

    return () => {
      clipAction.fadeOut(0.2);
    };
  }, [actions, animationId, names]);

  useEffect(() => {
    actionRef.current = createNextAction({
      kind: 'wander',
      actorIds,
      currentPosition: { x: pet.spawnPosition[0], z: pet.spawnPosition[2] },
      getActorPosition,
      stations,
    });
    setAnimationId(PET_WALK_ANIMATION_ID);
    setCurrentActionLabel(actionRef.current.label);
  }, [actorIds, getActorPosition, pet.spawnPosition, stations]);

  useFrame((_, delta) => {
    const root = rootRef.current;
    const action = actionRef.current;
    if (!root || !action) return;

    const now = performance.now();
    const current = root.position;

    if (action.phase === 'holding' && now >= action.endsAt) {
      startNextAction(current.x, current.z);
      return;
    }

    if (action.kind === 'wander') {
      if (now >= action.endsAt) {
        startNextAction(current.x, current.z);
        return;
      }

      movePetTowards({
        root,
        current,
        delta,
        target: action.target,
        movementAnimationId: PET_WALK_ANIMATION_ID,
        onArrive: () => {
          if (performance.now() >= action.endsAt) {
            startNextAction(current.x, current.z);
            return;
          }

          action.target = createRandomTarget(SCENE_CONFIG.actor.bounds, { x: current.x, z: current.z }, 0.8);
        },
        setAnimationId,
        lastAnimationRef,
      });
      return;
    }

    if (action.kind === 'eat') {
      if (action.phase === 'moving') {
        movePetTowards({
          root,
          current,
          delta,
          target: action.target,
          movementAnimationId: PET_WALK_ANIMATION_ID,
          onArrive: () => {
            action.phase = 'holding';
            syncAnimation(PET_EAT_ANIMATION_ID, setAnimationId, lastAnimationRef);
          },
          setAnimationId,
          lastAnimationRef,
        });
        return;
      }

      syncAnimation(PET_EAT_ANIMATION_ID, setAnimationId, lastAnimationRef);
      return;
    }

    if (action.kind === 'ask-for-petting') {
      if (action.phase === 'moving' && action.actorId) {
        const actorPosition = getActorPosition(action.actorId);
        if (actorPosition) {
          action.target = { x: actorPosition.x, z: actorPosition.z };
        }

        movePetTowards({
          root,
          current,
          delta,
          target: action.target,
          movementAnimationId: PET_WALK_ANIMATION_ID,
          onArrive: () => {
            action.phase = 'holding';
            syncAnimation(PET_PETTING_ANIMATION_ID, setAnimationId, lastAnimationRef);
          },
          setAnimationId,
          lastAnimationRef,
          arriveDistance: 0.85,
        });
        return;
      }

      syncAnimation(PET_PETTING_ANIMATION_ID, setAnimationId, lastAnimationRef);
    }
  });

  function startNextAction(currentX: number, currentZ: number) {
    const nextAction = createNextAction({
      actorIds,
      currentPosition: { x: currentX, z: currentZ },
      getActorPosition,
      stations,
    });
    actionRef.current = nextAction;
    setCurrentActionLabel(nextAction.label);
    syncAnimation(PET_WALK_ANIMATION_ID, setAnimationId, lastAnimationRef);
  }

  return (
    <group ref={rootRef} position={pet.spawnPosition}>
      <primitive object={clonedScene} ref={skinRef} scale={pet.scale} castShadow />
      <Html position={[0, pet.labelHeight, 0]} center style={{ pointerEvents: 'none' }}>
        <div
          style={{
            padding: '4px 10px',
            borderRadius: 999,
            fontSize: 11,
            fontWeight: 700,
            color: '#f8fafc',
            background: 'rgba(15, 23, 42, 0.8)',
            whiteSpace: 'nowrap',
          }}
        >
          {pet.name} · {currentActionLabel}
        </div>
      </Html>
    </group>
  );
}

function createNextAction({
  kind,
  actorIds,
  currentPosition,
  getActorPosition,
  stations,
}: {
  kind?: PetActionKind;
  actorIds: string[];
  currentPosition: { x: number; z: number };
  getActorPosition: (actorId: string) => { x: number; y: number; z: number } | null;
  stations: PetStation[];
}): PetActionState {
  const durationSeconds = Math.round(randomBetween(5, 20));
  const endsAt = performance.now() + durationSeconds * 1000;
  const actionKind = kind ?? PET_ACTIONS[Math.floor(Math.random() * PET_ACTIONS.length)];

  if (actionKind === 'eat' && stations.length) {
    const station = stations[Math.floor(Math.random() * stations.length)];
    return {
      kind: 'eat',
      phase: 'moving',
      endsAt,
      label: station.kind === 'food' ? 'Comendo' : 'Bebendo agua',
      stationId: station.id,
      target: { x: station.position[0], z: station.position[2] },
    };
  }

  if (actionKind === 'ask-for-petting' && actorIds.length) {
    const actorId = actorIds[Math.floor(Math.random() * actorIds.length)];
    const actorPosition = getActorPosition(actorId);

    if (actorPosition) {
      return {
        kind: 'ask-for-petting',
        phase: 'moving',
        endsAt,
        label: 'Pedindo carinho',
        actorId,
        target: { x: actorPosition.x, z: actorPosition.z },
      };
    }
  }

  return {
    kind: 'wander',
    phase: 'moving',
    endsAt,
    label: 'Passeando',
    target: createRandomTarget(SCENE_CONFIG.actor.bounds, currentPosition, 0.8),
  };
}

function movePetTowards({
  root,
  current,
  delta,
  target,
  movementAnimationId,
  onArrive,
  setAnimationId,
  lastAnimationRef,
  arriveDistance = 0.3,
}: {
  root: THREE.Group;
  current: THREE.Vector3;
  delta: number;
  target: { x: number; z: number };
  movementAnimationId: string;
  onArrive: () => void;
  setAnimationId: (animationId: string) => void;
  lastAnimationRef: MutableRefObject<string | null>;
  arriveDistance?: number;
}) {
  syncAnimation(movementAnimationId, setAnimationId, lastAnimationRef);

  const dx = target.x - current.x;
  const dz = target.z - current.z;
  const distance = Math.sqrt(dx * dx + dz * dz);

  if (distance < arriveDistance) {
    onArrive();
    return;
  }

  const dirX = dx / distance;
  const dirZ = dz / distance;

  current.x += dirX * SCENE_CONFIG.actor.speed * delta;
  current.z += dirZ * SCENE_CONFIG.actor.speed * delta;

  clampPosition(current, SCENE_CONFIG.actor.bounds);

  const desiredRotationY = Math.atan2(dirX, dirZ);
  root.rotation.y = lerpAngle(root.rotation.y, desiredRotationY, Math.min(1, delta * SCENE_CONFIG.actor.rotationLerp));
}

function syncAnimation(
  nextAnimationId: string,
  setAnimationId: (animationId: string) => void,
  lastAnimationRef: MutableRefObject<string | null>
) {
  if (lastAnimationRef.current === nextAnimationId) return;
  lastAnimationRef.current = nextAnimationId;
  setAnimationId(nextAnimationId);
}

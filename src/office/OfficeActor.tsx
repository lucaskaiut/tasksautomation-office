import { useFrame } from '@react-three/fiber';
import { Html, useAnimations, useGLTF } from '@react-three/drei';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { SCENE_CONFIG } from '../sceneConfig';
import { resolveCharacterModelUrl } from './officeActorDefinitions';
import { clipSearchVariantsWithFallback, findAnimationAction } from './animationResolve';
import { useActorRuntime } from './ActorRuntimeProvider';

const WANDER_ANIMATION_IDS = new Set(['walk', 'sprint']);

export type OfficeActorProps = {
  actorId: string;
  name: string;
  character: string;
  spawnPosition: [number, number, number];
};

export function OfficeActor({ actorId, name, character, spawnPosition }: OfficeActorProps) {
  const rootRef = useRef<THREE.Group>(null);
  const skinRef = useRef<THREE.Object3D>(null);
  const targetRef = useRef(
    createNextTarget(SCENE_CONFIG.actor.bounds, { x: spawnPosition[0], z: spawnPosition[2] })
  );
  const { animationId, command, dispatch } = useActorRuntime(actorId);
  const lastRequestedAnimationRef = useRef<string | null>(null);

  const modelUrl = useMemo(() => resolveCharacterModelUrl(character), [character]);
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
  }, [actions, names, animationId]);

  const hasCommand = Boolean(command && command.type !== 'NONE');
  const wander = WANDER_ANIMATION_IDS.has(animationId) && !hasCommand;
  const speedMultiplier = animationId === 'sprint' ? 1.75 : 1;

  useFrame((_, delta) => {
    const root = rootRef.current;
    if (!root) return;

    const current = root.position;
    const speed = SCENE_CONFIG.actor.speed * speedMultiplier;

    if (command?.type === 'GO_TO_AND_SIT') {
      if (lastRequestedAnimationRef.current !== 'walk') {
        lastRequestedAnimationRef.current = 'walk';
        dispatch({ type: 'SET_ACTOR_ANIMATION', actorId, animationId: 'walk' });
      }

      const dx = command.target.x - current.x;
      const dz = command.target.z - current.z;
      const distance = Math.sqrt(dx * dx + dz * dz);

      if (distance < command.arriveDistance) {
        if (lastRequestedAnimationRef.current !== 'sit') {
          lastRequestedAnimationRef.current = 'sit';
          dispatch({ type: 'SET_ACTOR_ANIMATION', actorId, animationId: 'sit' });
        }
        dispatch({ type: 'CLEAR_ACTOR_COMMAND', actorId });
        return;
      }

      const dirX = dx / distance;
      const dirZ = dz / distance;

      current.x += dirX * speed * delta;
      current.z += dirZ * speed * delta;

      clampPosition(current, SCENE_CONFIG.actor.bounds);

      const desiredRotationY = Math.atan2(dirX, dirZ);
      root.rotation.y = lerpAngle(
        root.rotation.y,
        desiredRotationY,
        Math.min(1, delta * SCENE_CONFIG.actor.rotationLerp)
      );
      return;
    }

    if (command?.type === 'GO_TO_DESK') {
      if (lastRequestedAnimationRef.current !== command.movementAnimationId) {
        lastRequestedAnimationRef.current = command.movementAnimationId;
        dispatch({ type: 'SET_ACTOR_ANIMATION', actorId, animationId: command.movementAnimationId });
      }

      const dx = command.target.x - current.x;
      const dz = command.target.z - current.z;
      const distance = Math.sqrt(dx * dx + dz * dz);

      if (distance < command.arriveDistance) {
        if (lastRequestedAnimationRef.current !== command.onArriveAnimationId) {
          lastRequestedAnimationRef.current = command.onArriveAnimationId;
          dispatch({ type: 'SET_ACTOR_ANIMATION', actorId, animationId: command.onArriveAnimationId });
        }
        dispatch({ type: 'CLEAR_ACTOR_COMMAND', actorId });
        return;
      }

      const dirX = dx / distance;
      const dirZ = dz / distance;

      current.x += dirX * speed * delta;
      current.z += dirZ * speed * delta;

      clampPosition(current, SCENE_CONFIG.actor.bounds);

      const desiredRotationY = Math.atan2(dirX, dirZ);
      root.rotation.y = lerpAngle(
        root.rotation.y,
        desiredRotationY,
        Math.min(1, delta * SCENE_CONFIG.actor.rotationLerp)
      );
      return;
    }

    if (command?.type === 'GO_TO_POINT') {
      if (lastRequestedAnimationRef.current !== command.movementAnimationId) {
        lastRequestedAnimationRef.current = command.movementAnimationId;
        dispatch({ type: 'SET_ACTOR_ANIMATION', actorId, animationId: command.movementAnimationId });
      }

      const dx = command.target.x - current.x;
      const dz = command.target.z - current.z;
      const distance = Math.sqrt(dx * dx + dz * dz);

      if (distance < command.arriveDistance) {
        if (lastRequestedAnimationRef.current !== command.onArriveAnimationId) {
          lastRequestedAnimationRef.current = command.onArriveAnimationId;
          dispatch({ type: 'SET_ACTOR_ANIMATION', actorId, animationId: command.onArriveAnimationId });
        }
        dispatch({ type: 'CLEAR_ACTOR_COMMAND', actorId });
        return;
      }

      const dirX = dx / distance;
      const dirZ = dz / distance;

      current.x += dirX * speed * delta;
      current.z += dirZ * speed * delta;

      clampPosition(current, SCENE_CONFIG.actor.bounds);

      const desiredRotationY = Math.atan2(dirX, dirZ);
      root.rotation.y = lerpAngle(
        root.rotation.y,
        desiredRotationY,
        Math.min(1, delta * SCENE_CONFIG.actor.rotationLerp)
      );
      return;
    }

    if (!wander) return;

    const target = targetRef.current;

    const dx = target.x - current.x;
    const dz = target.z - current.z;
    const distance = Math.sqrt(dx * dx + dz * dz);

    if (distance < 0.15) {
      targetRef.current = createNextTarget(SCENE_CONFIG.actor.bounds, current);
      return;
    }

    const dirX = dx / distance;
    const dirZ = dz / distance;

    current.x += dirX * speed * delta;
    current.z += dirZ * speed * delta;

    clampPosition(current, SCENE_CONFIG.actor.bounds);

    const desiredRotationY = Math.atan2(dirX, dirZ);
    root.rotation.y = lerpAngle(root.rotation.y, desiredRotationY, Math.min(1, delta * SCENE_CONFIG.actor.rotationLerp));
  });

  return (
    <group ref={rootRef} position={spawnPosition}>
      <primitive
        ref={skinRef}
        object={clonedScene}
        position={SCENE_CONFIG.actor.startPosition}
        scale={SCENE_CONFIG.actor.scale}
        castShadow
      />
      <Html position={[0, 2.05, 0]} center style={{ pointerEvents: 'none' }}>
        <div
          style={{
            padding: '4px 10px',
            borderRadius: 6,
            fontSize: 11,
            fontWeight: 600,
            color: '#fafafa',
            background: 'rgba(0,0,0,0.72)',
            whiteSpace: 'nowrap',
            maxWidth: 220,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {name}
        </div>
      </Html>
    </group>
  );
}

function createNextTarget(
  bounds: { minX: number; maxX: number; minZ: number; maxZ: number },
  currentPosition?: { x: number; z: number }
) {
  const padding = 0.35;
  const minX = bounds.minX + padding;
  const maxX = bounds.maxX - padding;
  const minZ = bounds.minZ + padding;
  const maxZ = bounds.maxZ - padding;

  let x = randomBetween(minX, maxX);
  let z = randomBetween(minZ, maxZ);

  if (currentPosition) {
    let attempts = 0;
    while (distance2D(currentPosition.x, currentPosition.z, x, z) < 1.2 && attempts < 12) {
      x = randomBetween(minX, maxX);
      z = randomBetween(minZ, maxZ);
      attempts += 1;
    }
  }

  return { x, z };
}

function clampPosition(
  position: { x: number; z: number },
  bounds: { minX: number; maxX: number; minZ: number; maxZ: number }
) {
  position.x = Math.max(bounds.minX, Math.min(bounds.maxX, position.x));
  position.z = Math.max(bounds.minZ, Math.min(bounds.maxZ, position.z));
}

function lerpAngle(start: number, end: number, alpha: number) {
  const delta = ((((end - start) % (Math.PI * 2)) + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
  return start + delta * alpha;
}

function randomBetween(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

function distance2D(ax: number, az: number, bx: number, bz: number) {
  const dx = bx - ax;
  const dz = bz - az;
  return Math.sqrt(dx * dx + dz * dz);
}

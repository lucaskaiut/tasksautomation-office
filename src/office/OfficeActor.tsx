import { useFrame } from '@react-three/fiber';
import { Html, useAnimations, useGLTF } from '@react-three/drei';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { SCENE_CONFIG } from '../sceneConfig';
import { resolveFurnitureCollision } from './officeFurniture';
import { resolveCharacterModelUrl } from './officeActorDefinitions';
import { clipSearchVariantsWithFallback, findAnimationAction } from './animationResolve';
import { useActorRuntime } from './ActorRuntimeProvider';
import { useSceneActorRegistry } from './SceneActorRegistry';
import { clampPosition, createRandomTarget, lerpAngle } from './motion';

const WANDER_ANIMATION_IDS = new Set(['walk', 'sprint']);
const ACTOR_COLLISION_RADIUS = 0.32;

export type OfficeActorProps = {
  actorId: string;
  name: string;
  character: string;
  spawnPosition: [number, number, number];
  spawnRotation?: [number, number, number];
};

export function OfficeActor({
  actorId,
  name,
  character,
  spawnPosition,
  spawnRotation = [0, 0, 0],
}: OfficeActorProps) {
  const rootRef = useRef<THREE.Group>(null);
  const skinRef = useRef<THREE.Object3D>(null);
  const targetRef = useRef(
    createRandomTarget(SCENE_CONFIG.actor.bounds, { x: spawnPosition[0], z: spawnPosition[2] })
  );
  const { animationId, command, dispatch } = useActorRuntime(actorId);
  const { registerActor } = useSceneActorRegistry();
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

  useEffect(() => {
    return registerActor(actorId, () => {
      const root = rootRef.current;
      if (!root) return null;
      return {
        x: root.position.x,
        y: root.position.y,
        z: root.position.z,
      };
    });
  }, [actorId, registerActor]);

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

      moveActor(current, { x: dirX, z: dirZ }, speed, delta);

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

      moveActor(current, { x: dirX, z: dirZ }, speed, delta);

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
        if (command.onArriveAnimationId === 'sit') {
          root.rotation.set(spawnRotation[0], spawnRotation[1], spawnRotation[2]);
        }
        dispatch({ type: 'CLEAR_ACTOR_COMMAND', actorId });
        return;
      }

      const dirX = dx / distance;
      const dirZ = dz / distance;

      moveActor(current, { x: dirX, z: dirZ }, speed, delta);

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
      targetRef.current = createRandomTarget(SCENE_CONFIG.actor.bounds, current);
      return;
    }

    const dirX = dx / distance;
    const dirZ = dz / distance;

    moveActor(current, { x: dirX, z: dirZ }, speed, delta);

    const desiredRotationY = Math.atan2(dirX, dirZ);
    root.rotation.y = lerpAngle(root.rotation.y, desiredRotationY, Math.min(1, delta * SCENE_CONFIG.actor.rotationLerp));
  });

  return (
    <group ref={rootRef} position={spawnPosition} rotation={spawnRotation}>
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

function moveActor(
  position: { x: number; z: number },
  direction: { x: number; z: number },
  speed: number,
  delta: number
) {
  const previous = { x: position.x, z: position.z };
  const next = {
    x: position.x + direction.x * speed * delta,
    z: position.z + direction.z * speed * delta,
  };

  clampPosition(next, SCENE_CONFIG.actor.bounds);
  const resolved = resolveFurnitureCollision(next, previous, ACTOR_COLLISION_RADIUS);

  position.x = resolved.x;
  position.z = resolved.z;
}

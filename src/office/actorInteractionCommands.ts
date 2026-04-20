import type { Dispatch } from 'react';
import * as THREE from 'three';
import type { ActorRuntimeAction, ActorCommand } from './actorRuntimeTypes';
import { OFFICE_FURNITURE } from './officeFurniture';

function findDeskById(furnitureId: string) {
  return OFFICE_FURNITURE.find((p) => p.id === furnitureId && p.kind === 'desk') ?? null;
}

export function computeApproachPointForDesk(desk: {
  position: [number, number, number];
  rotation?: [number, number, number];
}) {
  const y = desk.rotation?.[1] ?? 0;
  const forward = new THREE.Vector3(0, 0, 1).applyAxisAngle(new THREE.Vector3(0, 1, 0), y);
  const approachDistance = 1.15;
  return {
    x: desk.position[0] + forward.x * approachDistance,
    z: desk.position[2] + forward.z * approachDistance,
  };
}

export function issueOwnerInteractWithDesk(
  dispatch: Dispatch<ActorRuntimeAction>,
  actorId: string,
  furnitureId: string
) {
  const desk = findDeskById(furnitureId);
  if (!desk) return { ok: false as const, reason: 'desk_not_found' as const };
  if (!desk.ownerActorId || desk.ownerActorId !== actorId) {
    return { ok: false as const, reason: 'not_owner' as const };
  }

  const target = computeApproachPointForDesk(desk);
  const command: ActorCommand = {
    type: 'GO_TO_AND_SIT',
    furnitureId,
    target,
    arriveDistance: 0.35,
  };

  dispatch({ type: 'SET_ACTOR_COMMAND', actorId, command });
  return { ok: true as const };
}

export function issueActorGoToDesk(
  dispatch: Dispatch<ActorRuntimeAction>,
  actorId: string,
  furnitureId: string,
  movementAnimationId: 'walk' | 'sprint'
) {
  const desk = findDeskById(furnitureId);
  if (!desk) return { ok: false as const, reason: 'desk_not_found' as const };

  const target = computeApproachPointForDesk(desk);
  const command: ActorCommand = {
    type: 'GO_TO_DESK',
    furnitureId,
    target,
    arriveDistance: 0.35,
    movementAnimationId,
    onArriveAnimationId: 'sit',
  };

  dispatch({ type: 'SET_ACTOR_COMMAND', actorId, command });
  return { ok: true as const };
}

export function issueActorReturnToPoint(
  dispatch: Dispatch<ActorRuntimeAction>,
  actorId: string,
  target: { x: number; z: number },
  movementAnimationId: 'walk' | 'sprint' = 'walk'
) {
  const command: ActorCommand = {
    type: 'GO_TO_POINT',
    target,
    arriveDistance: 0.25,
    movementAnimationId,
    onArriveAnimationId: 'idle',
  };

  dispatch({ type: 'SET_ACTOR_COMMAND', actorId, command });
  return { ok: true as const };
}


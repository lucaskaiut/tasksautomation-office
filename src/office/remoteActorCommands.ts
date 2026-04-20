import type { Dispatch } from 'react';
import type { ActorRuntimeAction } from './actorRuntimeTypes';
import { issueOwnerInteractWithDesk } from './actorInteractionCommands';

export function setActorAnimationFromRemote(
  dispatch: Dispatch<ActorRuntimeAction>,
  actorId: string,
  animationId: string
) {
  dispatch({ type: 'SET_ACTOR_ANIMATION', actorId, animationId });
}

export function interactOwnerWithDeskFromRemote(
  dispatch: Dispatch<ActorRuntimeAction>,
  actorId: string,
  furnitureId: string
) {
  return issueOwnerInteractWithDesk(dispatch, actorId, furnitureId);
}

export const OFFICE_ANIMATION_IDS = [
  'walk',
  'sprint',
  'idle',
  'sit',
  'pick-up',
  'emote-yes',
  'emote-no',
  'interact-right',
  'interact-left',
] as const;

export type OfficeAnimationId = (typeof OFFICE_ANIMATION_IDS)[number];

export type ActorCommand =
  | {
      type: 'GO_TO_AND_SIT';
      furnitureId: string;
      target: { x: number; z: number };
      arriveDistance: number;
    }
  | {
      type: 'GO_TO_DESK';
      furnitureId: string;
      target: { x: number; z: number };
      arriveDistance: number;
      movementAnimationId: 'walk' | 'sprint';
      onArriveAnimationId: 'sit' | 'idle';
    }
  | {
      type: 'GO_TO_POINT';
      target: { x: number; z: number };
      arriveDistance: number;
      movementAnimationId: 'walk' | 'sprint';
      onArriveAnimationId: 'idle' | 'sit';
    }
  | { type: 'NONE' };

export type ActorRuntimeSnapshot = {
  animationId: string;
  command?: ActorCommand;
};

export type ActorRuntimeState = {
  actors: Record<string, ActorRuntimeSnapshot>;
};

export type ActorRuntimeAction =
  | { type: 'SET_ACTOR_ANIMATION'; actorId: string; animationId: string }
  | { type: 'SET_ACTOR_COMMAND'; actorId: string; command: ActorCommand }
  | { type: 'CLEAR_ACTOR_COMMAND'; actorId: string }
  | { type: 'REGISTER_ACTOR'; actorId: string; defaultAnimationId?: string }
  | { type: 'UNREGISTER_ACTOR'; actorId: string };

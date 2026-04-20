import React, { createContext, useCallback, useContext, useMemo, useReducer } from 'react';
import type { ActorRuntimeAction, ActorRuntimeState } from './actorRuntimeTypes';

function actorRuntimeReducer(state: ActorRuntimeState, action: ActorRuntimeAction): ActorRuntimeState {
  switch (action.type) {
    case 'SET_ACTOR_ANIMATION': {
      const prev = state.actors[action.actorId];
      if (prev?.animationId === action.animationId) return state;
      return {
        ...state,
        actors: {
          ...state.actors,
          [action.actorId]: { ...prev, animationId: action.animationId },
        },
      };
    }
    case 'SET_ACTOR_COMMAND': {
      const prev = state.actors[action.actorId];
      if (!prev) return state;
      return {
        ...state,
        actors: {
          ...state.actors,
          [action.actorId]: { ...prev, command: action.command },
        },
      };
    }
    case 'CLEAR_ACTOR_COMMAND': {
      const prev = state.actors[action.actorId];
      if (!prev?.command) return state;
      return {
        ...state,
        actors: {
          ...state.actors,
          [action.actorId]: { ...prev, command: undefined },
        },
      };
    }
    case 'REGISTER_ACTOR': {
      if (state.actors[action.actorId]) return state;
      return {
        ...state,
        actors: {
          ...state.actors,
          [action.actorId]: {
            animationId: action.defaultAnimationId ?? 'idle',
          },
        },
      };
    }
    case 'UNREGISTER_ACTOR': {
      const { [action.actorId]: _removed, ...rest } = state.actors;
      return { ...state, actors: rest };
    }
    default:
      return state;
  }
}

type ActorRuntimeContextValue = {
  state: ActorRuntimeState;
  dispatch: React.Dispatch<ActorRuntimeAction>;
};

const ActorRuntimeContext = createContext<ActorRuntimeContextValue | null>(null);

export type ActorRuntimeProviderProps = {
  children: React.ReactNode;
  initialActors?: Record<string, { animationId: string }>;
};

export function ActorRuntimeProvider({ children, initialActors }: ActorRuntimeProviderProps) {
  const [state, dispatch] = useReducer(actorRuntimeReducer, undefined, () => ({
    actors: initialActors ?? {
      default: { animationId: 'walk' },
    },
  }));

  const value = useMemo(() => ({ state, dispatch }), [state, dispatch]);

  return <ActorRuntimeContext.Provider value={value}>{children}</ActorRuntimeContext.Provider>;
}

export function useActorRuntimeDispatch() {
  const ctx = useContext(ActorRuntimeContext);
  if (!ctx) {
    throw new Error('useActorRuntimeDispatch deve ser usado dentro de ActorRuntimeProvider');
  }
  return ctx.dispatch;
}

export function useActorRuntimeState() {
  const ctx = useContext(ActorRuntimeContext);
  if (!ctx) {
    throw new Error('useActorRuntimeState deve ser usado dentro de ActorRuntimeProvider');
  }
  return ctx.state;
}

export function useActorRuntime(actorId: string) {
  const ctx = useContext(ActorRuntimeContext);
  if (!ctx) {
    throw new Error('useActorRuntime deve ser usado dentro de ActorRuntimeProvider');
  }
  const { state, dispatch } = ctx;
  const snapshot = state.actors[actorId];

  const setAnimation = useCallback(
    (animationId: string) => {
      dispatch({ type: 'SET_ACTOR_ANIMATION', actorId, animationId });
    },
    [actorId, dispatch]
  );

  return useMemo(
    () => ({
      animationId: snapshot?.animationId ?? 'idle',
      command: snapshot?.command,
      setAnimation,
      dispatch,
      isRegistered: Boolean(snapshot),
    }),
    [snapshot?.animationId, snapshot?.command, setAnimation, dispatch, snapshot]
  );
}

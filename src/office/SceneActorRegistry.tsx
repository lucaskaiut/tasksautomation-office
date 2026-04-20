import { createContext, useCallback, useContext, useMemo, useRef, type ReactNode } from 'react';

export type SceneActorPosition = {
  x: number;
  y: number;
  z: number;
};

type SceneActorRegistryValue = {
  registerActor: (actorId: string, getPosition: () => SceneActorPosition | null) => () => void;
  getActorPosition: (actorId: string) => SceneActorPosition | null;
  listActorIds: () => string[];
};

const SceneActorRegistryContext = createContext<SceneActorRegistryValue | null>(null);

export function SceneActorRegistryProvider({ children }: { children: ReactNode }) {
  const registryRef = useRef(new Map<string, () => SceneActorPosition | null>());

  const registerActor = useCallback((actorId: string, getPosition: () => SceneActorPosition | null) => {
    registryRef.current.set(actorId, getPosition);
    return () => {
      registryRef.current.delete(actorId);
    };
  }, []);

  const getActorPosition = useCallback((actorId: string) => {
    const resolver = registryRef.current.get(actorId);
    return resolver?.() ?? null;
  }, []);

  const listActorIds = useCallback(() => [...registryRef.current.keys()], []);

  const value = useMemo(
    () => ({
      registerActor,
      getActorPosition,
      listActorIds,
    }),
    [getActorPosition, listActorIds, registerActor]
  );

  return <SceneActorRegistryContext.Provider value={value}>{children}</SceneActorRegistryContext.Provider>;
}

export function useSceneActorRegistry() {
  const ctx = useContext(SceneActorRegistryContext);
  if (!ctx) {
    throw new Error('useSceneActorRegistry deve ser usado dentro de SceneActorRegistryProvider');
  }
  return ctx;
}

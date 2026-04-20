export type OfficeActorDefinition = {
  id: string;
  name: string;
  character: string;
  spawnPosition: [number, number, number];
};

export function resolveCharacterModelUrl(character: string) {
  return `/models/${character}/model.glb`;
}

export const OFFICE_ACTOR_DEFINITIONS: OfficeActorDefinition[] = [
  { id: 'analysis', name: 'Worker 01', character: 'character', spawnPosition: [-7.2, 0, 4.2] },
  { id: 'implementation:frontend', name: 'Worker 02', character: 'character', spawnPosition: [-6.4, 0, 4.2] },
  {
    id: 'implementation:backend',
    name: 'Worker 03',
    character: 'character',
    spawnPosition: [-6.8, 0, 3.5],
  },
];

export function buildInitialActorRuntime(animationId = 'walk') {
  return Object.fromEntries(OFFICE_ACTOR_DEFINITIONS.map((d) => [d.id, { animationId }]));
}

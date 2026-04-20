export type OfficeActorDefinition = {
  id: string;
  name: string;
  character: string;
  spawnPosition: [number, number, number];
  spawnRotation?: [number, number, number];
};

export function resolveCharacterModelUrl(character: string) {
  return `/models/${character}/model.glb`;
}

export const OFFICE_ACTOR_DEFINITIONS: OfficeActorDefinition[] = [
  {
    id: 'analysis',
    name: 'Worker 01',
    character: 'character',
    spawnPosition: [-7.7, 0, 4.05],
    spawnRotation: [0, Math.PI, 0],
  },
  {
    id: 'implementation:frontend',
    name: 'Worker 02',
    character: 'character',
    spawnPosition: [-6.85, 0, 4.05],
    spawnRotation: [0, Math.PI, 0],
  },
  {
    id: 'implementation:backend',
    name: 'Worker 03',
    character: 'character',
    spawnPosition: [-6, 0, 4.05],
    spawnRotation: [0, Math.PI, 0],
  },
];

export function buildInitialActorRuntime(animationId = 'walk') {
  return Object.fromEntries(OFFICE_ACTOR_DEFINITIONS.map((d) => [d.id, { animationId }]));
}

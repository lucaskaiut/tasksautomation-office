export type PetDefinition = {
  id: string;
  name: string;
  character: string;
  fallbackCharacter: string;
  spawnPosition: [number, number, number];
  scale: number;
  labelHeight: number;
};

export type PetStationKind = 'food' | 'water';

export type PetStation = {
  id: string;
  kind: PetStationKind;
  position: [number, number, number];
};

export const PET_DEFINITIONS: PetDefinition[] = [
  {
    id: 'pet-cat',
    name: 'Cat',
    character: 'cat',
    fallbackCharacter: 'character',
    spawnPosition: [2.8, 0, 4.6],
    scale: 0.3,
    labelHeight: 1.1,
  },
  {
    id: 'pet-dog',
    name: 'Dog',
    character: 'dog',
    fallbackCharacter: 'character',
    spawnPosition: [3.8, 0, 3.6],
    scale: 0.34,
    labelHeight: 1.2,
  },
];

export const PET_STATIONS: PetStation[] = [
  { id: 'pet-food-left', kind: 'food', position: [-7.1, 0.02, -4.5] },
  { id: 'pet-water-left', kind: 'water', position: [-6.1, 0.02, -4.5] },
  { id: 'pet-food-right', kind: 'food', position: [7.1, 0.02, 4.5] },
  { id: 'pet-water-right', kind: 'water', position: [6.1, 0.02, 4.5] },
];

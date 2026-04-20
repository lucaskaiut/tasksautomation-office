export type OfficeFurnitureKind = 'desk';

export type OfficeFurniturePiece = {
  id: string;
  kind: OfficeFurnitureKind;
  position: [number, number, number];
  rotation?: [number, number, number];
  ownerActorId?: string | null;
};

export const OFFICE_FURNITURE: OfficeFurniturePiece[] = [
  { id: 'desk-left-near', kind: 'desk', position: [-5.2, 0, -2.6], ownerActorId: 'analysis' },
  { id: 'desk-left-far', kind: 'desk', position: [-5.2, 0, 2.6], ownerActorId: 'implementation:frontend' },
  {
    id: 'desk-right-near',
    kind: 'desk',
    position: [5.2, 0, -2.6],
    rotation: [0, Math.PI, 0],
    ownerActorId: 'implementation:backend',
  },
  { id: 'desk-right-far', kind: 'desk', position: [5.2, 0, 2.6], rotation: [0, Math.PI, 0] },
];

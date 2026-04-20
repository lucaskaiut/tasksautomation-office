---
name: office-scene-tuning
description: Ajusta cena 3D (câmera, bounds, luzes, performance) e comportamento de movimento (velocidade, wander, rotação). Use quando o usuário pedir mudanças na câmera, iluminação, tamanho da sala, limites, performance do Canvas, ou suavidade de animações/movimento.
---

# Office: ajustes de cena e movimento

## Objetivo

Modificar a experiência visual e de navegação na cena sem quebrar:

- clamp de movimento
- controles de câmera
- layout e render do Canvas

## Pontos de controle principais

- Configuração geral: `src/sceneConfig.ts`
  - `camera.position`, `camera.target`, `fov`, distâncias, `maxPolarAngle`
  - `actor.speed`, `actor.rotationLerp`, `actor.bounds`, `actor.scale`
- Cena: `src/App.tsx`
  - luzes, sombras, `Environment`, fog, `OrbitControls`
- Movimento/animações: `src/office/OfficeActor.tsx`
  - wander (`WANDER_ANIMATION_IDS`)
  - multiplicadores (`sprint`)
  - `arriveDistance` e comportamento por comando
- UI/layout: `src/index.css`

## Checklist para mudanças comuns

### Câmera “mais perto/mais longe”

- Ajustar `SCENE_CONFIG.camera.position`
- Ajustar `minDistance`/`maxDistance`
- Se o `OrbitControls` parecer “resetar”, lembrar que `SyncOrbitCamera` reaplica posição/target em `useLayoutEffect`

### Aumentar/diminuir sala e limites

- Ajustar `ROOM.width`/`ROOM.depth` em `src/sceneConfig.ts`
- `actor.bounds` deriva da sala (min/max X/Z)
- Validar `spawnPosition` dos atores (em `src/office/officeActorDefinitions.ts`)
- Validar posições das mesas (em `src/office/officeFurniture.ts`)

### Movimento mais suave ou mais “responsivo”

- Rotação: aumentar/diminuir `actor.rotationLerp`
- Velocidade: ajustar `actor.speed` e multiplicador de sprint no `OfficeActor`
- “Chegada” no alvo: ajustar `arriveDistance` nas funções de comando (`src/office/actorInteractionCommands.ts`)

### Performance

Opções que costumam ajudar:

- reduzir sombras (ou `shadow-mapSize`)
- reduzir luzes/densidade de fog
- evitar `Html` excessivo (labels) se houver muitos atores
- manter preload de GLB (já existe em `src/main.tsx`)


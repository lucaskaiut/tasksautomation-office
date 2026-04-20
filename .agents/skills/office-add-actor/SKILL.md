---
name: office-add-actor
description: Adiciona um novo ator/personagem no “escritório” 3D, incluindo definição, spawn, preload e (opcional) mesa. Use quando o usuário pedir para criar/adicionar um ator, worker, personagem, stage novo ou ajustar posições iniciais.
---

# Office: adicionar ator

## Objetivo

Adicionar um novo ator à cena, garantindo que ele:

- aparece no `Canvas`
- tem estado inicial no runtime
- tem modelo GLB carregado/precarregado
- pode ser selecionado na UI e receber animações/comandos

## Checklist rápido

- [ ] Definir o ator em `src/office/officeActorDefinitions.ts`
- [ ] Garantir que o `character` aponte para `public/models/<character>/model.glb`
- [ ] Ajustar `spawnPosition` dentro de `SCENE_CONFIG.actor.bounds` (`src/sceneConfig.ts`)
- [ ] (Opcional) Criar mesa para o ator em `src/office/officeFurniture.ts` com `ownerActorId`
- [ ] Verificar se o ator aparece em `ActorControlPanel` (ele lista `OFFICE_ACTOR_DEFINITIONS`)
- [ ] Verificar se o preload ocorre (é derivado de `OFFICE_ACTOR_DEFINITIONS` em `src/main.tsx`)

## Passo a passo

### 1) Criar a definição do ator

Edite `src/office/officeActorDefinitions.ts` e adicione um item em `OFFICE_ACTOR_DEFINITIONS`:

- `id`: string estável; se houver integração realtime, este valor deve bater com o stage/stage_slug esperado pelo payload.
- `name`: label exibido acima do personagem e na sidebar.
- `character`: pasta do modelo em `public/models/<character>/model.glb`.
- `spawnPosition`: `[x, y, z]`.

### 2) Posicionamento e colisão “implícita”

O movimento faz clamp em `SCENE_CONFIG.actor.bounds`. Garanta que:

- `spawnPosition[0]` esteja entre `minX` e `maxX`
- `spawnPosition[2]` esteja entre `minZ` e `maxZ`

Se precisar “abrir espaço”, ajuste bounds em `src/sceneConfig.ts`.

### 3) Mesa opcional (para comandos e realtime)

Se o ator deve “ir para a mesa”:

- adicione uma peça `desk` em `src/office/officeFurniture.ts`
- defina `ownerActorId` como o `id` do ator
- ajuste `position` e (se necessário) `rotation`

Isso habilita:

- botão “Sentar na mesa” (painel filtra por `ownerActorId`)
- movimentos do realtime (ponte resolve a mesa do ator por `ownerActorId`)

### 4) Modelos GLB

Confirme a existência do arquivo:

- `public/models/<character>/model.glb`

O app resolve a URL por `resolveCharacterModelUrl` (`/models/<character>/model.glb`) e pré-carrega no boot (`src/main.tsx`).

## Observações

- Não há roteamento: o render dos atores é sempre `OFFICE_ACTOR_DEFINITIONS.map(...)` em `src/App.tsx`.
- Não coloque segredos em `public/` ou no código; tokens ficam em variáveis `VITE_*`.


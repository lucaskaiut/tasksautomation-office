---
name: office-add-animation
description: Adiciona ou corrige uma animação do personagem (clip GLB) no projeto, incluindo ID, toolbar, resolução com fallback e validação no runtime. Use quando o usuário pedir novas animações (walk/sit/emotes), renomear clips, ou quando um animationId não toca.
---

# Office: adicionar/corrigir animações

## Objetivo

Garantir que um `animationId` configurado no runtime:

- apareça na UI (toolbar)
- seja resolvido para um clip existente no GLB
- toque com transições (fadeIn/fadeOut)

## Onde isso acontece

- IDs disponíveis: `src/office/actorRuntimeTypes.ts` (`OFFICE_ANIMATION_IDS`)
- Toolbar: `src/components/ActorAnimationToolbar.tsx`
- Player: `src/office/OfficeActor.tsx` (`useAnimations` + efeito por `animationId`)
- Resolução/fallback: `src/office/animationResolve.ts`

## Passo a passo

### 1) Adicionar o ID da animação

Edite `src/office/actorRuntimeTypes.ts` e inclua o novo id em `OFFICE_ANIMATION_IDS`.

Notas:

- Mantenha ids curtos e consistentes (ex.: `emote-wave`, `interact-phone`).
- O tipo `OfficeAnimationId` é derivado desse array.

### 2) Fazer o player encontrar o clip certo

O player busca o clip por nome usando variantes e fallbacks em `src/office/animationResolve.ts`.

Se o nome no GLB for diferente do seu `animationId`, adicione fallbacks em `FALLBACK_CLIP_NAMES`:

- chave: seu `animationId`
- valor: lista de nomes prováveis do clip (ex.: `wave`, `waving`, `handwave`)

O algoritmo:

- normaliza nomes
- tenta match exato normalizado e depois “contains”
- se nada bater, usa o primeiro clip do GLB como fallback

### 3) Conferir integração com o runtime

O `OfficeActor` reage a `animationId` mudando:

- `reset().fadeIn(0.25).play()`
- no cleanup: `fadeOut(0.2)`

Isso significa que alternar animações rapidamente pode causar fades concorrentes; se necessário, reduza a lista da toolbar ou imponha regras no runtime.

### 4) Se a animação depende de movimento

Se a animação representa “andar/correr”, ela também influencia comportamento:

- `walk`/`sprint` habilitam “wander” quando não há comando
- `sprint` aumenta velocidade por multiplicador no `useFrame`

Ao introduzir um novo tipo de movimento, decida se ele deve entrar nesse conjunto em `src/office/OfficeActor.tsx` (`WANDER_ANIMATION_IDS` e multiplicadores).

## Debug rápido (“não toca”)

- Verifique se o GLB contém o clip (nomes em `useAnimations` -> `names`).
- Adicione um fallback em `FALLBACK_CLIP_NAMES`.
- Se o clip existe mas o skinRef/scene não está correto, confirme que `useAnimations(animations, skinRef)` aponta para o objeto animável.


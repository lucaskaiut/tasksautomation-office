---
name: office-runbook
description: Operação e configuração local do projeto (Vite dev/build), variáveis VITE_*, e validações rápidas do fluxo 3D/realtime sem vazar segredos. Use quando o usuário pedir como rodar, configurar .env, testar WebSocket, ou verificar porque não conecta.
---

# Office: runbook (rodar e validar)

## Rodar localmente

- Instalar deps:
  - `npm install`
- Ambiente dev:
  - `npm run dev`
- Build:
  - `npm run build`
- Preview:
  - `npm run preview`

## Variáveis de ambiente (Vite)

Este projeto lê (na ponte realtime) as variáveis:

- `VITE_TASKS_API_BASE_URL`
- `VITE_TASKS_SANCTUM_BEARER_TOKEN`
- opcional: `VITE_TASKS_REALTIME_PUBLIC_WS_ORIGIN`

Boas práticas:

- preferir `.env.local` para tokens
- nunca commitar tokens reais
- se precisar compartilhar exemplos, use placeholders (ex.: `VITE_TASKS_SANCTUM_BEARER_TOKEN=REDACTED`)

## Validação rápida (sem realtime)

Mesmo sem WebSocket, você consegue validar:

- cena renderiza (Canvas)
- atores aparecem (lista em `OFFICE_ACTOR_DEFINITIONS`)
- toolbar de animações altera clips (se os clips existirem)
- botão “Sentar na mesa” gera comando e movimento

Arquivos para checar:

- `src/App.tsx` (Canvas + atores + provider)
- `src/components/ActorControlPanel.tsx` (UI)
- `src/office/OfficeActor.tsx` (movimento + player)

## Validação rápida (com realtime)

Se os atores não reagirem:

- verificar se `TasksRealtimeBridge` está montado em `src/App.tsx`
- confirmar que `VITE_TASKS_API_BASE_URL` e `VITE_TASKS_SANCTUM_BEARER_TOKEN` estão preenchidos
- confirmar o contrato `stage -> actorId` (stage precisa bater com `OFFICE_ACTOR_DEFINITIONS[i].id`)


---
name: office-realtime-debug
description: Diagnostica e ajusta o fluxo realtime (WebSocket + ponte de eventos) que controla atores por status/stage/priority. Use quando o usuário mencionar websocket, ws-token, reconexão, subscribe, event parsing, stage_slug, ou quando os atores não reagem a eventos.
---

# Office: depurar realtime (WebSocket)

## Objetivo

Garantir que:

- o cliente WS conecta (token/URL)
- o subscribe é enviado
- eventos são parseados
- a ponte traduz eventos em comandos/animações
- o roteamento `stage -> actorId` está correto

## Arquivos relevantes

- Cliente: `src/realtime/tasksWebsocketClient.ts`
- Ponte: `src/realtime/TasksRealtimeBridge.tsx`
- Tipos: `src/realtime/tasksRealtimeTypes.ts`
- Comandos: `src/office/actorInteractionCommands.ts`
- Runtime: `src/office/ActorRuntimeProvider.tsx`
- Atores: `src/office/OfficeActor.tsx`

## Checklist de diagnóstico

### 1) Configuração de ambiente (Vite)

Confirmar variáveis:

- `VITE_TASKS_API_BASE_URL`
- `VITE_TASKS_SANCTUM_BEARER_TOKEN`
- opcional: `VITE_TASKS_REALTIME_PUBLIC_WS_ORIGIN`

Regras:

- não expor token em logs/documentos
- preferir `.env.local` para valores sensíveis

### 2) Endpoint de token

O cliente chama:

- `GET <apiBaseUrl>/api/realtime/tasks/ws-token`

Verificar:

- status HTTP
- shape do JSON (campos `token`, `expires_in_seconds`, `websocket_path`, `websocket_url`)

Se o backend não retornar `websocket_url`, o cliente deriva a origem WS do `apiBaseUrl` (http->ws, https->wss) ou usa `publicWsOrigin`.

### 3) Subscribe

A ponte envia no `onopen`:

- `type: "subscribe"`
- `subscriptions: [{ scope: "index", page: 1, per_page: 20 }]`

Se o backend espera outro payload (ex.: `channel`, `project_id`), ajustar o `subscribePayload` em `TasksRealtimeBridge.tsx`.

### 4) Roteamento: evento -> ator

O roteamento depende do “stage” extraído:

- `extractStageId(event)` tenta múltiplos campos (task e presentation)
- só aplica se `stageId` estiver em `OFFICE_ACTOR_DEFINITIONS.map(a => a.id)`

Se os atores não reagem:

- conferir se o payload traz `stage_slug`/`current_stage` compatível com os `id`s do escritório
- se necessário, adaptar `extractStageId` para o formato real do backend
- alternativa: mapear stage externo -> actorId interno via tabela

### 5) Regras de comportamento

Verificar se o `status` esperado coincide com o backend:

- `claimed` -> ir para mesa (`walk`/`sprint` por prioridade)
- `done`/`review` -> `emote-yes` e retorno
- `failed` -> `emote-no` e retorno

Se o backend usar outros valores, ajuste `shouldYesEmote`, `shouldNoEmote` e a comparação de `claimed`.

### 6) Reconexão e renovação de token

O cliente:

- faz backoff com jitter
- força reconectar quando chega na metade do `expires_in_seconds`

Se houver loop de reconexão:

- verificar `publicWsOrigin` vs origem real
- verificar CORS/proxy do endpoint de token (HTTP) e o WS (upgrade)
- verificar se o backend invalida token cedo

## Melhorias típicas (quando necessário)

- adicionar callback `onStatus` para refletir status no UI
- logar (de forma segura) apenas `type` de evento e chaves presentes, sem payload completo
- suportar múltiplas subscriptions/escopos


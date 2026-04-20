import type { TasksRealtimeEvent, TasksWsTokenResponse } from './tasksRealtimeTypes';

type TasksWebsocketClientOptions = {
  apiBaseUrl: string;
  bearerToken: string;
  publicWsOrigin?: string;
  subscribePayload?: unknown;
  onEvent: (event: TasksRealtimeEvent) => void;
  onStatus?: (status: { state: 'connecting' | 'open' | 'closed' | 'error'; detail?: string }) => void;
};

type StopHandle = {
  stop: () => void;
};

function normalizeApiBaseUrl(apiBaseUrl: string) {
  if (!apiBaseUrl) return '';
  return apiBaseUrl.endsWith('/') ? apiBaseUrl.slice(0, -1) : apiBaseUrl;
}

function inferPublicWsOriginFromApiBaseUrl(apiBaseUrl: string): string | undefined {
  const normalized = normalizeApiBaseUrl(apiBaseUrl);
  if (!normalized) return undefined;
  try {
    const url = new URL(normalized);
    const scheme = url.protocol === 'https:' ? 'wss:' : url.protocol === 'http:' ? 'ws:' : null;
    if (!scheme) return undefined;
    url.protocol = scheme;
    url.pathname = '';
    url.search = '';
    url.hash = '';
    return url.toString();
  } catch {
    return undefined;
  }
}

function buildWsUrl(params: {
  websocket_url: string | null;
  websocket_path: string;
  token: string;
  publicWsOrigin?: string;
  apiBaseUrl?: string;
}) {
  if (params.websocket_url) return params.websocket_url;
  const origin = params.publicWsOrigin ?? (params.apiBaseUrl ? inferPublicWsOriginFromApiBaseUrl(params.apiBaseUrl) : undefined);
  if (!origin) {
    throw new Error('Sem websocket_url e sem publicWsOrigin para montar a URL do WebSocket.');
  }
  const url = new URL(params.websocket_path, origin);
  url.searchParams.set('token', params.token);
  return url.toString();
}

async function fetchWsToken(opts: { apiBaseUrl: string; bearerToken: string }): Promise<TasksWsTokenResponse['data']> {
  const apiBaseUrl = normalizeApiBaseUrl(opts.apiBaseUrl);
  const res = await fetch(`${apiBaseUrl}/api/realtime/tasks/ws-token`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${opts.bearerToken}`,
      Accept: 'application/json',
    },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Falha ao obter ws-token: HTTP ${res.status} ${text}`.trim());
  }
  const body = (await res.json()) as TasksWsTokenResponse;
  return body.data;
}

export function startTasksWebsocketClient(options: TasksWebsocketClientOptions): StopHandle {
  let stopped = false;
  let socket: WebSocket | null = null;
  let reconnectAttempt = 0;
  let reconnectTimer: number | null = null;
  let tokenRefreshTimer: number | null = null;

  const cleanupTimers = () => {
    if (reconnectTimer) window.clearTimeout(reconnectTimer);
    if (tokenRefreshTimer) window.clearTimeout(tokenRefreshTimer);
    reconnectTimer = null;
    tokenRefreshTimer = null;
  };

  const closeSocket = () => {
    if (!socket) return;
    try {
      socket.onopen = null;
      socket.onclose = null;
      socket.onerror = null;
      socket.onmessage = null;
      socket.close();
    } catch {
      //
    }
    socket = null;
  };

  const scheduleReconnect = (reason: string) => {
    if (stopped) return;
    cleanupTimers();
    closeSocket();

    const base = Math.min(30_000, 750 * Math.pow(1.6, reconnectAttempt));
    const jitter = Math.random() * 350;
    const delay = Math.max(600, base + jitter);
    reconnectAttempt += 1;
    options.onStatus?.({ state: 'closed', detail: `${reason}. Reconectando em ${Math.round(delay)}ms...` });

    reconnectTimer = window.setTimeout(() => {
      void connect();
    }, delay);
  };

  const connect = async () => {
    if (stopped) return;
    cleanupTimers();

    options.onStatus?.({ state: 'connecting' });

    let tokenData: TasksWsTokenResponse['data'];
    try {
      tokenData = await fetchWsToken({ apiBaseUrl: options.apiBaseUrl, bearerToken: options.bearerToken });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      scheduleReconnect(`Erro ao buscar token (${msg})`);
      return;
    }

    let wsUrl: string;
    try {
      wsUrl = buildWsUrl({
        websocket_url: tokenData.websocket_url,
        websocket_path: tokenData.websocket_path,
        token: tokenData.token,
        publicWsOrigin: options.publicWsOrigin,
        apiBaseUrl: options.apiBaseUrl,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      scheduleReconnect(`Erro ao montar URL WS (${msg})`);
      return;
    }

    try {
      socket = new WebSocket(wsUrl);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      scheduleReconnect(`Erro ao abrir WebSocket (${msg})`);
      return;
    }

    socket.onopen = () => {
      if (stopped) return;
      reconnectAttempt = 0;
      options.onStatus?.({ state: 'open' });

      if (options.subscribePayload) {
        try {
          socket?.send(JSON.stringify(options.subscribePayload));
        } catch {
          //
        }
      }

      const refreshMs = Math.max(30_000, (tokenData.expires_in_seconds * 1000) / 2);
      tokenRefreshTimer = window.setTimeout(() => {
        scheduleReconnect('Renovando token');
      }, refreshMs);
    };

    socket.onmessage = (ev) => {
      if (stopped) return;
      if (typeof ev.data !== 'string') return;
      try {
        const parsed = JSON.parse(ev.data) as TasksRealtimeEvent;
        options.onEvent(parsed);
      } catch {
        //
      }
    };

    socket.onerror = () => {
      if (stopped) return;
      options.onStatus?.({ state: 'error' });
    };

    socket.onclose = (ev) => {
      if (stopped) return;
      const detail = `close code=${ev.code} reason=${ev.reason || 'n/a'}`;
      scheduleReconnect(detail);
    };
  };

  void connect();

  return {
    stop: () => {
      stopped = true;
      cleanupTimers();
      closeSocket();
    },
  };
}


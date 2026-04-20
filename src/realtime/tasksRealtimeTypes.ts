export type TasksRealtimeEvent =
  | { type: 'connection.ready'; connected_at?: string }
  | { type: 'subscription.synced'; tasks?: unknown[]; synced_at?: string }
  | TasksRealtimeTaskEvent;

export type TasksRealtimeTaskEvent =
  | {
      type: 'task.snapshot' | 'task.created' | 'task.updated' | 'task.deleted';
      task_id?: number | string;
      project_id?: number | string;
      occurred_at?: string;
      task?: Record<string, unknown> | null;
      presentation?: Record<string, unknown> | null;
      changes?: Record<string, { from: unknown; to: unknown }>;
    }
  | { type: string; [k: string]: unknown };

export type TasksWsTokenResponse = {
  data: {
    token: string;
    expires_in_seconds: number;
    websocket_path: string;
    websocket_url: string | null;
  };
  message?: string;
};


import { useEffect, useMemo, useRef } from 'react';
import { useActorRuntimeDispatch } from '../office/ActorRuntimeProvider';
import { issueActorGoToDesk, issueActorReturnToPoint } from '../office/actorInteractionCommands';
import { OFFICE_ACTOR_DEFINITIONS } from '../office/officeActorDefinitions';
import { OFFICE_FURNITURE } from '../office/officeFurniture';
import type { TasksRealtimeEvent } from './tasksRealtimeTypes';
import { startTasksWebsocketClient } from './tasksWebsocketClient';

type ActorId = string;

function normalizeString(v: unknown) {
  return typeof v === 'string' ? v : v == null ? '' : String(v);
}

function getTaskObject(event: TasksRealtimeEvent) {
  if (typeof event !== 'object' || !event) return null;
  const any = event as Record<string, unknown>;
  const task = any.task;
  if (task && typeof task === 'object') return task as Record<string, unknown>;
  if (
    typeof any.status === 'string' ||
    typeof any.stage === 'string' ||
    typeof any.current_stage === 'string' ||
    typeof any.priority === 'string' ||
    any.stage_slug != null ||
    any.pipeline_stage_slug != null
  ) {
    return any as Record<string, unknown>;
  }
  return null;
}

function getPresentationObject(event: TasksRealtimeEvent) {
  if (typeof event !== 'object' || !event) return null;
  const any = event as Record<string, unknown>;
  const p = any.presentation;
  return p && typeof p === 'object' ? (p as Record<string, unknown>) : null;
}

function stageFromUnknown(v: unknown): string {
  if (typeof v === 'string') return v.trim();
  if (v && typeof v === 'object') {
    const o = v as Record<string, unknown>;
    const slug = o.slug ?? o.name ?? o.key ?? o.code ?? o.id;
    if (typeof slug === 'string') return slug.trim();
    if (slug != null) return String(slug).trim();
  }
  return '';
}

function extractStageId(event: TasksRealtimeEvent): string {
  const task = getTaskObject(event);
  const presentation = getPresentationObject(event);
  const stageRaw =
    task?.current_stage ??
    task?.stage ??
    task?.pipeline_stage ??
    task?.stage_slug ??
    task?.pipeline_stage_slug ??
    presentation?.stage ??
    presentation?.pipeline_stage ??
    presentation?.worker_stage ??
    presentation?.stage_slug ??
    presentation?.pipeline_stage_slug;
  return stageFromUnknown(stageRaw);
}

function extractStatus(event: TasksRealtimeEvent): string {
  const task = getTaskObject(event);
  if (!task) return '';
  const s = task.status;
  if (typeof s === 'string') return s.trim();
  return normalizeString(s);
}

function extractPriority(event: TasksRealtimeEvent): string {
  const task = getTaskObject(event);
  const presentation = getPresentationObject(event);
  if (typeof task?.priority === 'string') return task.priority.trim();
  if (typeof presentation?.priority === 'string') return presentation.priority.trim();
  return '';
}

function isHighPriority(priority: string) {
  const p = priority.trim().toLowerCase();
  return p === 'high' || p === 'hight' || p === 'urgent' || p === 'p1';
}

function resolveDeskIdForActor(actorId: ActorId) {
  const desk = OFFICE_FURNITURE.find((p) => p.kind === 'desk' && p.ownerActorId === actorId);
  return desk?.id ?? null;
}

function resolveHomePointForActor(actorId: ActorId) {
  const def = OFFICE_ACTOR_DEFINITIONS.find((d) => d.id === actorId);
  if (!def) return null;
  return { x: def.spawnPosition[0], z: def.spawnPosition[2] };
}

function shouldYesEmote(status: string) {
  const s = status.trim().toLowerCase();
  return s === 'done' || s === 'review';
}

function shouldNoEmote(status: string) {
  const s = status.trim().toLowerCase();
  return s === 'failed';
}

export function TasksRealtimeBridge() {
  const dispatch = useActorRuntimeDispatch();
  const timeoutsByActorRef = useRef<Map<string, number>>(new Map());

  const actorIds = useMemo(() => new Set(OFFICE_ACTOR_DEFINITIONS.map((a) => a.id)), []);

  useEffect(() => {
    const clearActorTimeout = (actorId: string) => {
      const id = timeoutsByActorRef.current.get(actorId);
      if (id) window.clearTimeout(id);
      timeoutsByActorRef.current.delete(actorId);
    };

    const scheduleReturnHome = (actorId: string, delayMs: number) => {
      clearActorTimeout(actorId);
      const timeoutId = window.setTimeout(() => {
        const home = resolveHomePointForActor(actorId);
        if (!home) return;
        issueActorReturnToPoint(dispatch, actorId, home, 'walk');
        dispatch({ type: 'SET_ACTOR_ANIMATION', actorId, animationId: 'idle' });
      }, delayMs);
      timeoutsByActorRef.current.set(actorId, timeoutId);
    };

    const applyTaskLikePayload = (payload: TasksRealtimeEvent) => {
      const stageId = extractStageId(payload);
      if (!actorIds.has(stageId)) return;

      const status = extractStatus(payload);
      const priority = extractPriority(payload);
      const actorId = stageId;

      clearActorTimeout(actorId);

      if (status.trim().toLowerCase() === 'claimed') {
        const deskId = resolveDeskIdForActor(actorId);
        if (!deskId) return;
        const movement = isHighPriority(priority) ? 'sprint' : 'walk';
        issueActorGoToDesk(dispatch, actorId, deskId, movement);
        return;
      }

      if (shouldYesEmote(status)) {
        dispatch({ type: 'SET_ACTOR_ANIMATION', actorId, animationId: 'emote-yes' });
        scheduleReturnHome(actorId, 1600);
        return;
      }

      if (shouldNoEmote(status)) {
        dispatch({ type: 'SET_ACTOR_ANIMATION', actorId, animationId: 'emote-no' });
        scheduleReturnHome(actorId, 1600);
        return;
      }

      const home = resolveHomePointForActor(actorId);
      if (!home) return;
      issueActorReturnToPoint(dispatch, actorId, home, 'walk');
      dispatch({ type: 'SET_ACTOR_ANIMATION', actorId, animationId: 'idle' });
    };

    const onEvent = (event: TasksRealtimeEvent) => {
      if (!event || typeof event !== 'object') return;
      const any = event as Record<string, unknown>;
      const type = normalizeString(any.type);

      if (type === 'subscription.synced') {
        const tasks = any.tasks;
        if (!Array.isArray(tasks)) return;
        for (const item of tasks) {
          if (item && typeof item === 'object') applyTaskLikePayload(item as TasksRealtimeEvent);
        }
        return;
      }

      if (!type.startsWith('task.')) return;
      applyTaskLikePayload(event);
    };

    const apiBaseUrl = import.meta.env.VITE_TASKS_API_BASE_URL ?? '';
    const bearerToken = import.meta.env.VITE_TASKS_SANCTUM_BEARER_TOKEN ?? '';
    const publicWsOrigin = import.meta.env.VITE_TASKS_REALTIME_PUBLIC_WS_ORIGIN;

    if (!apiBaseUrl || !bearerToken) {
      return () => {
        for (const id of timeoutsByActorRef.current.values()) window.clearTimeout(id);
        timeoutsByActorRef.current.clear();
      };
    }

    const subscribePayload = {
      type: 'subscribe',
      subscriptions: [{ scope: 'index', page: 1, per_page: 20 }],
    };

    const client = startTasksWebsocketClient({
      apiBaseUrl,
      bearerToken,
      publicWsOrigin,
      subscribePayload,
      onEvent,
    });

    return () => {
      client.stop();
      for (const id of timeoutsByActorRef.current.values()) window.clearTimeout(id);
      timeoutsByActorRef.current.clear();
    };
  }, [dispatch, actorIds]);

  return null;
}


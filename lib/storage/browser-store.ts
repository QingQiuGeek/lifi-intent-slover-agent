"use client";

import type { AgentStore, StoredSession } from "@/lib/storage/types";
import type { SubmittedOrder } from "@/lib/lifi/types";

const SESSIONS_KEY = "lifi-agent:v1:sessions";
const ORDERS_KEY = "lifi-agent:v1:orders";

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage quota exceeded or unavailable — fail silently
  }
}

export function createBrowserStore(): AgentStore {
  return {
    async listSessions() {
      return readJson<StoredSession[]>(SESSIONS_KEY, []);
    },
    async getSession(id) {
      const all = readJson<StoredSession[]>(SESSIONS_KEY, []);
      return all.find((s) => s.id === id) ?? null;
    },
    async saveSession(session) {
      const all = readJson<StoredSession[]>(SESSIONS_KEY, []);
      const idx = all.findIndex((s) => s.id === session.id);
      if (idx >= 0) {
        all[idx] = session;
      } else {
        all.unshift(session);
      }
      writeJson(SESSIONS_KEY, all);
    },
    async deleteSession(id) {
      const all = readJson<StoredSession[]>(SESSIONS_KEY, []);
      writeJson(
        SESSIONS_KEY,
        all.filter((s) => s.id !== id)
      );
    },
    async listOrders() {
      return readJson<SubmittedOrder[]>(ORDERS_KEY, []);
    },
    async getOrder(id) {
      const all = readJson<SubmittedOrder[]>(ORDERS_KEY, []);
      return (
        all.find(
          (o) => o.catalystOrderId === id || o.onChainOrderId === id
        ) ?? null
      );
    },
    async saveOrder(order) {
      const all = readJson<SubmittedOrder[]>(ORDERS_KEY, []);
      const idx = all.findIndex(
        (o) =>
          o.catalystOrderId === order.catalystOrderId ||
          o.onChainOrderId === order.onChainOrderId
      );
      if (idx >= 0) {
        all[idx] = order;
      } else {
        all.unshift(order);
      }
      writeJson(ORDERS_KEY, all);
    },
  };
}

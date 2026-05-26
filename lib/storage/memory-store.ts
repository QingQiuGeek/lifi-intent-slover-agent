import type { AgentStore, StoredSession } from "@/lib/storage/types";
import type { SubmittedOrder } from "@/lib/lifi/types";

export function createMemoryStore(): AgentStore {
  const sessions = new Map<string, StoredSession>();
  const orders = new Map<string, SubmittedOrder>();

  return {
    async listSessions() {
      return Array.from(sessions.values());
    },
    async getSession(id) {
      return sessions.get(id) ?? null;
    },
    async saveSession(session) {
      sessions.set(session.id, session);
    },
    async deleteSession(id) {
      sessions.delete(id);
    },
    async listOrders() {
      return Array.from(orders.values());
    },
    async getOrder(id) {
      return orders.get(id) ?? null;
    },
    async saveOrder(order) {
      const key = order.catalystOrderId ?? order.onChainOrderId ?? String(order.createdAt);
      orders.set(key, order);
    },
  };
}

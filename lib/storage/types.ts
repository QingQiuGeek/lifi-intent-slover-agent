import type { SubmittedOrder } from "@/lib/lifi/types";

export type StoredSession = {
  id: string;
  title: string;
  messages: unknown[];
  orderIds: string[];
  createdAt: number;
  updatedAt: number;
};

export type AgentStore = {
  listSessions(): Promise<StoredSession[]>;
  getSession(id: string): Promise<StoredSession | null>;
  saveSession(session: StoredSession): Promise<void>;
  deleteSession(id: string): Promise<void>;
  listOrders(): Promise<SubmittedOrder[]>;
  getOrder(id: string): Promise<SubmittedOrder | null>;
  saveOrder(order: SubmittedOrder): Promise<void>;
};

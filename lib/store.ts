import { J } from "./safeStorage";
import { MOCK_SUBS } from "./mockData";

export type Submission = {
  id: string;
  role: string;
  email: string;
  at: number;
  status: string;
  title: string;
  labels: Record<string, string>;
  values: Record<string, unknown>;
  updatedAt?: number;
  updatedBy?: string;
  returnReason?: string;
  returnedAt?: number;
  returnedBy?: string;
  assignedBuyer?: string;
  fixedAt?: number;
  returnedFixed?: boolean;
};

const KEY = "portal_subs";

export const Store = {
  all(): Submission[] {
    let a = J.get<Submission[] | null>(KEY, null);
    if (!a || !Array.isArray(a) || a.length === 0) {
      a = MOCK_SUBS;
      J.set(KEY, a);
    }
    return a;
  },
  put(r: Submission): void {
    const a = Store.all().filter((x) => x.id !== r.id);
    a.push(r);
    J.set(KEY, a);
  },
  update(id: string, partial: Partial<Submission>): Submission | null {
    const list = Store.all();
    const idx = list.findIndex((x) => x.id === id);
    if (idx >= 0) {
      list[idx] = { ...list[idx], ...partial };
      J.set(KEY, list);
      return list[idx];
    }
    return null;
  },
  resetMock(): Submission[] {
    J.set(KEY, MOCK_SUBS);
    return MOCK_SUBS;
  },
};

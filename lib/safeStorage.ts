export const J = {
  get<T>(key: string, def: T): T {
    try {
      const v = JSON.parse(localStorage.getItem(key) as string);
      return v == null ? def : (v as T);
    } catch {
      return def;
    }
  },
  set(key: string, value: unknown): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // storage unavailable or quota exceeded — ignore, matches original behavior
    }
  },
};

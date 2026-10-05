export const esc = (v: unknown): string =>
  String(v ?? "").replace(/[&<>"]/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c] as string)
  );

export const fdt = (t: number): string =>
  new Date(t).toLocaleString("th-TH", { dateStyle: "medium", timeStyle: "short" });

export const fmt = (n: number, d = 0): string =>
  n.toLocaleString("th-TH", { maximumFractionDigits: d });

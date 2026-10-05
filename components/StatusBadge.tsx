const VARIANTS: Record<string, { dot: string; wrap: string; text: string }> = {
  "ส่งคืนให้ Buyer แก้ไข": {
    dot: "bg-rose-500 animate-pulse",
    wrap: "bg-rose-50 border-rose-200",
    text: "text-rose-700",
  },
  "ตรวจ/แก้ไขแล้ว": {
    dot: "bg-emerald-500",
    wrap: "bg-emerald-50 border-emerald-200",
    text: "text-emerald-700",
  },
};

const DEFAULT_VARIANT = {
  dot: "bg-amber-500",
  wrap: "bg-amber-50 border-amber-200",
  text: "text-amber-700",
};

export function StatusBadge({ status }: { status: string }) {
  const v = VARIANTS[status] || DEFAULT_VARIANT;
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${v.wrap} ${v.text}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${v.dot}`} />
      <span className={v.text}>{status || "รอ Buyer ตรวจ"}</span>
    </span>
  );
}

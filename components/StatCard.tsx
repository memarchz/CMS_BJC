type StatCardProps = {
  label: string;
  value: number | string;
  colorClassName?: string;
  actionLabel?: string;
  onAction?: () => void;
};

export function StatCard({
  label,
  value,
  colorClassName = "text-gray-900",
  actionLabel,
  onAction,
}: StatCardProps) {
  return (
    <div className="bg-white rounded-2xl shadow-xs p-4 border border-gray-100">
      <div className="text-xs text-gray-500 font-medium">{label}</div>
      <div className={`text-3xl font-bold ${colorClassName} mt-1`}>{value}</div>
      {actionLabel ? (
        <button
          type="button"
          onClick={onAction}
          className="text-xs text-emerald-700 font-semibold hover:underline flex items-center gap-1 mt-3"
        >
          <span>{actionLabel}</span>
          <span>&rarr;</span>
        </button>
      ) : null}
    </div>
  );
}

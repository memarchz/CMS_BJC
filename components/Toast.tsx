type ToastProps = {
  message: string;
  visible: boolean;
  // Each original page ships its own toast classes; defaults to submissions.html's.
  className?: string;
};

const DEFAULT_CLASS =
  "fixed bottom-6 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-sm px-5 py-2.5 rounded-full shadow-lg z-50 transition-all font-medium";

export function Toast({ message, visible, className = DEFAULT_CLASS }: ToastProps) {
  return (
    <div data-testid="toast" className={`${visible ? "" : "hidden "}${className}`}>
      {message}
    </div>
  );
}

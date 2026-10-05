import type { ReactNode } from "react";

type Props = {
  open: boolean;
  onClose: () => void;
  /** Tailwind classes of the backdrop beyond `hidden`/`fixed inset-0` (differs per modal in admin.html). */
  backdropClassName: string;
  panelClassName: string;
  children: ReactNode;
};

/**
 * Overlay shell matching the admin.html modals exactly (backdrop blur, 3xl radius, shadow-2xl).
 * The shared components/Modal has a different look, so the admin modals use this instead.
 * Children are mounted only while open so each modal's form state resets on every opening.
 */
export function AdminModal({ open, onClose, backdropClassName, panelClassName, children }: Props) {
  return (
    <div
      data-testid="modal-backdrop"
      className={`${open ? "" : "hidden "}fixed inset-0 ${backdropClassName}`}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className={panelClassName}>{open ? children : null}</div>
    </div>
  );
}

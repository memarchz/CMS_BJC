import type { ReactNode } from "react";

type ModalProps = {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  maxWidthClassName?: string;
};

export function Modal({ open, onClose, children, maxWidthClassName = "max-w-2xl" }: ModalProps) {
  return (
    <div
      data-testid="modal-backdrop"
      className={`${
        open ? "" : "hidden "
      }fixed inset-0 bg-black/40 z-40 flex items-start justify-center p-4 overflow-y-auto`}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className={`bg-white rounded-2xl w-full ${maxWidthClassName} my-8 p-6 shadow-xl`}>
        {children}
      </div>
    </div>
  );
}

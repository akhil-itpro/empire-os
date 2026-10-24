"use client";

import { X } from "lucide-react";
import { useEffect, useId, useRef, type ReactNode } from "react";
import { cn } from "@/lib/cn";

type SheetProps = {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  children: ReactNode;
  className?: string;
};

// A bottom sheet built on the native <dialog>, which traps focus, closes on
// Escape and returns focus to the button that opened it.
export function Sheet({ open, onClose, title, children, className }: SheetProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onClose={onClose}
      onClick={(event) => {
        // A tap on the dimmed area outside the panel closes the sheet.
        if (event.target === ref.current) onClose();
      }}
      className={cn(
        "fixed inset-x-0 top-auto bottom-0 mx-auto mb-0 max-h-[90dvh] w-full max-w-[480px] overflow-y-auto rounded-t-[20px] border-0 border-t border-rule bg-ledger p-0 text-bone [--notch:var(--color-ledger)]",
        "translate-y-0 transition-[translate,overlay,display] transition-discrete duration-200 ease-out starting:open:translate-y-full",
        "backdrop:bg-field/75 backdrop:transition-opacity backdrop:duration-200 starting:open:backdrop:opacity-0",
        className,
      )}
    >
      <div className="px-5 pt-2 pb-[calc(20px+env(safe-area-inset-bottom))]">
        <div aria-hidden="true" className="mx-auto h-1 w-10 rounded-full bg-rule" />
        <div className="mt-2 flex items-start justify-between gap-3">
          <h2
            id={titleId}
            className="pt-2.5 font-display text-[26px] leading-none font-extrabold"
          >
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="-mr-2.5 flex size-11 flex-none items-center justify-center rounded-full text-bone hov:bg-raised"
          >
            <X size={22} strokeWidth={2} aria-hidden="true" />
          </button>
        </div>
        <div className="mt-3">{children}</div>
      </div>
    </dialog>
  );
}

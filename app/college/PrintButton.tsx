"use client";

/** Opens the browser's print dialog, where "Save as PDF" makes the PDF. */
export function PrintButton({ label }: { label: string }) {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="flex h-11 items-center gap-2 rounded-[10px] bg-brass px-4 text-[15px] font-bold text-field hov:bg-brass-light print:hidden"
    >
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M12 4v11M7 10l5 5 5-5M5 20h14" />
      </svg>
      {label}
    </button>
  );
}

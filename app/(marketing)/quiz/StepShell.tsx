import { ChevronLeft } from "lucide-react";
import type { ReactNode } from "react";
import { ProgressTicks } from "@/components/ui/ProgressTicks";
import { QUESTION_COUNT } from "@/lib/quiz/questions";

type StepShellProps = {
  onBack?: () => void;
  /** 1 to 11 while answering questions; shows the progress ticks. */
  questionNumber?: number;
  children: ReactNode;
  /** The bottom action area, in the thumb zone. */
  footer?: ReactNode;
};

// The quiz frame from Quiz.dc.html: back arrow and progress ticks on top,
// content, then the primary action at the bottom.
export function StepShell({ onBack, questionNumber, children, footer }: StepShellProps) {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[480px] flex-col px-5 pt-2 pb-5">
      <div className="flex h-[52px] flex-none items-center gap-3">
        {onBack ? (
          <button
            type="button"
            onClick={onBack}
            aria-label="Back"
            className="-ml-3 flex size-11 flex-none items-center justify-center rounded-full text-bone hov:bg-raised"
          >
            <ChevronLeft size={24} strokeWidth={2} aria-hidden="true" />
          </button>
        ) : null}
        {questionNumber ? (
          <>
            <ProgressTicks done={questionNumber} total={QUESTION_COUNT} label="Quiz progress" />
            <span className="text-sm font-medium whitespace-nowrap text-moss">
              {questionNumber} of {QUESTION_COUNT}
            </span>
          </>
        ) : null}
      </div>
      <div className="flex flex-1 flex-col">{children}</div>
      {footer ? <div className="mt-6 flex flex-none flex-col">{footer}</div> : null}
    </main>
  );
}

export function StepTitle({ children, help }: { children: ReactNode; help?: ReactNode }) {
  return (
    <>
      <h1 className="mt-7 font-display text-[40px] leading-none font-extrabold">{children}</h1>
      {help ? <p className="mt-3 text-[15px] text-moss">{help}</p> : null}
    </>
  );
}

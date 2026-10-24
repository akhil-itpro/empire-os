// Quiz answers stay in this browser until sign-up, then are saved and cleared.
// "Under 18" clears everything and stores nothing.
import type { Answers } from "@/lib/plan-engine/answers";

const KEY = "empire.quiz.v1";
const REFERRAL_KEY = "empire.ref";

export type QuizDraft = {
  ageBracket?: Answers["ageBracket"];
  answers: Partial<Answers>;
  /** Where the student is in the flow, so a refresh doesn't lose progress. */
  step: string;
};

function storage(): Storage | null {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    return null;
  }
}

export function loadDraft(): QuizDraft | null {
  try {
    const raw = storage()?.getItem(KEY);
    return raw ? (JSON.parse(raw) as QuizDraft) : null;
  } catch {
    return null;
  }
}

export function saveDraft(draft: QuizDraft) {
  try {
    storage()?.setItem(KEY, JSON.stringify(draft));
  } catch {
    // Private mode or full storage: the quiz still works, it just won't survive a refresh.
  }
}

export function clearDraft() {
  try {
    storage()?.removeItem(KEY);
  } catch {
    // Nothing to clear.
  }
}

/** A referral code from /r/CODE, kept until sign-up. */
export function saveReferral(code: string) {
  try {
    storage()?.setItem(REFERRAL_KEY, code.slice(0, 16));
  } catch {
    // Ignore.
  }
}

export function loadReferral(): string | null {
  try {
    return storage()?.getItem(REFERRAL_KEY) ?? null;
  } catch {
    return null;
  }
}

export function clearReferral() {
  try {
    storage()?.removeItem(REFERRAL_KEY);
  } catch {
    // Ignore.
  }
}

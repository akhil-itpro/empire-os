// A batch code from a /join/CODE link, kept in this browser until the student
// has an account and can join from Me. The server checks the code again.

const KEY = "empire.batchCode.v1";
export const BATCH_CODE = /^[A-Z0-9]{6,10}$/;

export function savePendingBatchCode(code: string) {
  try {
    localStorage.setItem(KEY, code);
  } catch {
    // Private browsing: the student can still type the code in Me.
  }
}

export function pendingBatchCode(): string | null {
  try {
    const code = localStorage.getItem(KEY);
    return code && BATCH_CODE.test(code) ? code : null;
  } catch {
    return null;
  }
}

export function clearPendingBatchCode() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // Nothing to clear.
  }
}

// The paywall opens uninvited only once: on the first HQ visit after full access ends
// (docs/PRODUCT.md section 7, "at most once a day uninvited"). Every other opening
// is the student's own tap. Browser-only.
const KEY = "empire.paywall.uninvited";

/** True the first time it's called on this device; records the date it was shown. */
export function takeUninvitedPaywall(): boolean {
  try {
    if (localStorage.getItem(KEY)) return false;
    localStorage.setItem(KEY, new Date().toISOString().slice(0, 10));
    return true;
  } catch {
    // Without storage, never open it uninvited.
    return false;
  }
}

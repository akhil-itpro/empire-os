// Shared by the server and the Season Pass page (safe for browser code).

/** The stand-in Razorpay key in local test mode; the page shows a test checkout for it. */
export const FAKE_KEY_ID = "rzp_test_fakekey";

/** Razorpay's checkout script, loaded only when a student starts paying. */
export const RAZORPAY_CHECKOUT_JS = "https://checkout.razorpay.com/v1/checkout.js";

"use client";

import { useState } from "react";
import { testSignIn } from "@/app/actions/auth";
import { Button } from "@/components/ui/Button";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

// Local test mode (never production): a pretend sign-in for automated tests.
const TEST_MODE = process.env.NEXT_PUBLIC_EMPIRE_TEST_MODE === "1";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function configured() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);
}

function friendly(message: string): string {
  if (/rate limit|too many/i.test(message)) return "Too many tries. Wait a minute, then try again.";
  if (/expired|invalid/i.test(message)) return "That code didn't work. Check it, or send a new one.";
  return "Something went wrong. Try again in a moment.";
}

/**
 * Email one-time code and Google sign-in. `next` is where Google returns to;
 * `onSignedIn` runs after a code is verified in this tab.
 */
export function SignInOptions({ next, onSignedIn }: { next: string; onSignedIn: () => void }) {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [stage, setStage] = useState<"email" | "code">("email");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  if (TEST_MODE) {
    return (
      <Button
        variant="secondary"
        onClick={async () => {
          await testSignIn();
          onSignedIn();
        }}
      >
        Test sign-in (local test mode)
      </Button>
    );
  }

  if (!configured()) {
    return (
      <p className="rounded-xl border border-rule bg-ledger p-4 text-sm text-moss">
        Sign-in isn&apos;t connected yet. It switches on when the Supabase project is set up.
      </p>
    );
  }

  const sendCode = async () => {
    const value = email.trim().toLowerCase();
    if (!EMAIL.test(value) || value.length > 254) {
      setMessage("Enter a valid email address.");
      return;
    }
    setBusy(true);
    setMessage(null);
    const { error } = await createSupabaseBrowserClient().auth.signInWithOtp({
      email: value,
      options: { shouldCreateUser: true },
    });
    setBusy(false);
    if (error) {
      setMessage(friendly(error.message));
      return;
    }
    setEmail(value);
    setStage("code");
  };

  const verify = async () => {
    const token = code.replace(/\D/g, "");
    if (token.length < 6) {
      setMessage("Enter the code from the email.");
      return;
    }
    setBusy(true);
    setMessage(null);
    const { error } = await createSupabaseBrowserClient().auth.verifyOtp({ email, token, type: "email" });
    if (error) {
      setBusy(false);
      setMessage(friendly(error.message));
      return;
    }
    onSignedIn();
  };

  const google = async () => {
    setBusy(true);
    const { error } = await createSupabaseBrowserClient().auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}` },
    });
    if (error) {
      setBusy(false);
      setMessage(friendly(error.message));
    }
  };

  return (
    <div className="flex flex-col">
      {stage === "email" ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void sendCode();
          }}
          className="flex flex-col"
        >
          <label htmlFor="email" className="text-[13px] font-medium text-moss">
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            inputMode="email"
            maxLength={254}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1.5 h-14 w-full rounded-[14px] border-[1.5px] border-rule bg-ledger px-4 text-lg text-bone focus:border-brass focus:outline-none"
          />
          <Button type="submit" className="mt-4" disabled={busy || email.trim().length === 0}>
            {busy ? "Sending…" : "Email me a code"}
          </Button>
        </form>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void verify();
          }}
          className="flex flex-col"
        >
          <p className="text-[15px] text-moss">
            We sent a code to <span className="font-semibold text-bone">{email}</span>. It works for a few minutes.
          </p>
          <label htmlFor="code" className="mt-4 text-[13px] font-medium text-moss">
            Code
          </label>
          <input
            id="code"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={10}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="mt-1.5 h-14 w-full rounded-[14px] border-[1.5px] border-rule bg-ledger px-4 text-2xl tracking-[0.3em] text-bone tabular-nums focus:border-brass focus:outline-none"
          />
          <Button type="submit" className="mt-4" disabled={busy}>
            {busy ? "Checking…" : "Continue"}
          </Button>
          <Button
            variant="quiet"
            className="mt-1"
            onClick={() => {
              setStage("email");
              setCode("");
              setMessage(null);
            }}
          >
            Use a different email
          </Button>
        </form>
      )}

      {stage === "email" ? (
        <>
          <div className="my-4 flex items-center gap-3 text-sm text-moss" aria-hidden="true">
            <span className="h-px flex-1 bg-rule" />
            or
            <span className="h-px flex-1 bg-rule" />
          </div>
          <Button variant="secondary" onClick={google} disabled={busy}>
            Continue with Google
          </Button>
        </>
      ) : null}

      <p className="mt-3 min-h-5 text-sm text-bone" role="status" aria-live="polite">
        {message}
      </p>
    </div>
  );
}

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { leaveBatch } from "@/app/actions/college";
import { Button } from "@/components/ui/Button";
import { BATCH_CODE, pendingBatchCode } from "@/lib/college-code";
import type { Membership } from "@/lib/server/college-service";
import { useHydrated } from "@/lib/use-hydrated";

const longDate = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "long", timeZone: "UTC" });
const fmt = (d: string) => longDate.format(new Date(`${d}T00:00:00Z`));

/** Me, College season: join a batch with a code, or see the batch you're in and leave it. */
export function CollegeSeason({ membership }: { membership: Membership | null }) {
  return (
    <section className="mt-8" aria-labelledby="college">
      <h2 id="college" className="font-display text-[26px] leading-none font-extrabold">
        College season
      </h2>
      {membership ? <Member membership={membership} /> : <JoinWithCode />}
    </section>
  );
}

function Member({ membership: m }: { membership: Membership }) {
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const leave = async () => {
    setBusy(true);
    const result = await leaveBatch();
    setBusy(false);
    if (!result.ok) setMessage(result.message);
  };

  return (
    <div className="mt-3 rounded-xl border border-rule bg-ledger px-4 py-3.5">
      <p className="text-[15px] font-semibold">
        {m.batchName}, {m.orgName}
      </p>
      <p className="mt-1 text-sm text-moss">
        {m.section ? `Section ${m.section}. ` : ""}Season {fmt(m.startsOn)} to {fmt(m.endsOn)}. Your college sees you as{" "}
        {m.displayName}.
      </p>
      <p className="mt-2 text-sm text-moss">
        Your mission progress (not your journal or quiz answers) is shared with their training and placement cell.
      </p>
      {confirming ? (
        <div className="mt-3">
          <p className="text-sm text-bone">
            Leave {m.orgName}? Your account, XP and history stay. Your college stops seeing your progress
            {m.grantsPass ? ", and the Season Pass access from your college ends." : "."}
          </p>
          <div className="mt-2.5 flex gap-2.5">
            <Button variant="secondary" onClick={leave} disabled={busy}>
              {busy ? "Leaving" : "Leave the batch"}
            </Button>
            <Button variant="quiet" onClick={() => setConfirming(false)} disabled={busy}>
              Stay
            </Button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setConfirming(true)}
          className="-mb-1.5 inline-flex min-h-11 items-center text-sm font-semibold text-brass hov:text-brass-light"
        >
          Leave this batch
        </button>
      )}
      {message ? (
        <p role="alert" className="mt-2 text-sm text-bone">
          {message}
        </p>
      ) : null}
    </div>
  );
}

function JoinWithCode() {
  const router = useRouter();
  const hydrated = useHydrated();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const pending = hydrated ? pendingBatchCode() : null;

  const go = (value: string) => {
    const c = value.trim().toUpperCase();
    if (!BATCH_CODE.test(c)) {
      setError("Batch codes are 6 to 10 letters and numbers.");
      return;
    }
    router.push(`/me/college?code=${c}`);
  };

  return (
    <div>
      <p className="mt-1.5 text-[13px] text-moss">
        If your college runs an EMPIRE OS season, join with the code from your training and placement cell.
      </p>
      {pending ? (
        <p className="mt-3 rounded-xl border border-brass-deep bg-ledger px-4 py-3 text-sm">
          You opened a college invite link.{" "}
          <Link href={`/me/college?code=${pending}`} className="font-semibold text-brass hov:text-brass-light">
            See what joining shares
          </Link>
        </p>
      ) : null}
      <form
        className="mt-3 flex gap-2.5"
        onSubmit={(e) => {
          e.preventDefault();
          go(code);
        }}
      >
        <label htmlFor="batch-code" className="sr-only">
          Batch code
        </label>
        <input
          id="batch-code"
          value={code}
          onChange={(e) => {
            setCode(e.target.value.toUpperCase());
            setError(null);
          }}
          maxLength={10}
          autoCapitalize="characters"
          autoComplete="off"
          placeholder="Batch code"
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? "batch-code-error" : undefined}
          className="h-13 min-w-0 flex-1 rounded-xl border-[1.5px] border-rule bg-ledger px-4 text-base tracking-wide text-bone placeholder:text-moss"
        />
        <Button type="submit" variant="secondary" inline>
          Continue
        </Button>
      </form>
      {error ? (
        <p id="batch-code-error" role="alert" className="mt-2 text-sm text-bone">
          {error}
        </p>
      ) : null}
    </div>
  );
}

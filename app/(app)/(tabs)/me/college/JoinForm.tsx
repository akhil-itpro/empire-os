"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { joinBatch } from "@/app/actions/college";
import { Button, ButtonLink } from "@/components/ui/Button";
import { clearPendingBatchCode } from "@/lib/college-code";

/** Section and initial, then one clear button that gives consent. Nothing is pre-selected. */
export function JoinForm({
  code,
  sections,
  firstName,
}: {
  code: string;
  sections: string[];
  firstName: string;
}) {
  const router = useRouter();
  const [section, setSection] = useState("");
  const [initial, setInitial] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const shownAs = initial ? `${firstName} ${initial.toUpperCase()}.` : firstName;

  const join = async () => {
    if (sections.length > 0 && !section) {
      setMessage("Pick your section.");
      return;
    }
    setBusy(true);
    setMessage(null);
    const result = await joinBatch({ code, section: sections.length ? section : null, initial, consent: true });
    if (result.ok) {
      clearPendingBatchCode();
      router.push("/me");
      return;
    }
    setBusy(false);
    setMessage(result.message);
  };

  return (
    <form
      className="mt-6 flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        join();
      }}
    >
      {sections.length > 0 ? (
        <div>
          <label htmlFor="section" className="text-sm font-semibold">
            Your section
          </label>
          <select
            id="section"
            value={section}
            onChange={(e) => setSection(e.target.value)}
            className="mt-1.5 h-13 w-full rounded-xl border-[1.5px] border-rule bg-ledger px-4 text-base text-bone"
          >
            <option value="">Choose your section</option>
            {sections.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      ) : null}
      <div>
        <label htmlFor="initial" className="text-sm font-semibold">
          Initial of your last name (optional)
        </label>
        <input
          id="initial"
          value={initial}
          onChange={(e) => setInitial(e.target.value.replace(/[^A-Za-z]/g, "").slice(0, 1).toUpperCase())}
          maxLength={1}
          autoComplete="off"
          className="mt-1.5 h-13 w-20 rounded-xl border-[1.5px] border-rule bg-ledger px-4 text-center text-base text-bone"
        />
        <p className="mt-1.5 text-[13px] text-moss">Helps your college tell two people with the same name apart. They&apos;ll see you as {shownAs}.</p>
      </div>
      {message ? (
        <p role="alert" className="text-sm text-bone">
          {message}
        </p>
      ) : null}
      <div className="flex flex-col gap-2.5">
        <Button type="submit" disabled={busy}>
          {busy ? "Joining" : "Join and share my progress"}
        </Button>
        <ButtonLink href="/me" variant="quiet">
          Maybe later
        </ButtonLink>
      </div>
    </form>
  );
}

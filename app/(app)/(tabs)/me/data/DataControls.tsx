"use client";

import { useState, useTransition } from "react";
import { deleteAccount } from "@/app/actions/account";
import { Button, ButtonLink } from "@/components/ui/Button";

export function DataControls() {
  const [confirm, setConfirm] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [deleted, setDeleted] = useState(false);
  const [pending, startTransition] = useTransition();

  if (deleted) {
    return (
      <section className="mt-8" aria-live="polite">
        <h2 className="font-display text-[26px] leading-none font-extrabold">Your account is deleted.</h2>
        <p className="mt-3 text-[15px] text-bone">
          Your sign-in, profile, missions, journal and every other record linked to you are gone. We checked.
        </p>
        <ButtonLink href="/" variant="secondary" className="mt-6">
          Back to the home page
        </ButtonLink>
      </section>
    );
  }

  return (
    <>
      <section className="mt-8" aria-labelledby="download">
        <h2 id="download" className="font-display text-[26px] leading-none font-extrabold">
          Download my data
        </h2>
        <p className="mt-2 text-[15px] text-moss">A JSON file with your profile, missions, XP, journal and everything else linked to you.</p>
        <a
          href="/me/data/export"
          download
          className="mt-4 flex h-13 w-full items-center justify-center rounded-xl border-[1.5px] border-brass-deep text-base font-semibold text-bone hov:border-brass hov:bg-raised"
        >
          Download my data
        </a>
      </section>

      <section className="mt-10" aria-labelledby="delete">
        <h2 id="delete" className="font-display text-[26px] leading-none font-extrabold">
          Delete my account
        </h2>
        <p className="mt-2 text-[15px] text-moss">
          This deletes your sign-in and all your records for good. It can&apos;t be undone. Type DELETE to confirm.
        </p>
        <form
          className="mt-4"
          onSubmit={(e) => {
            e.preventDefault();
            startTransition(async () => {
              const r = await deleteAccount(confirm.trim());
              if (r.ok) setDeleted(true);
              else setMessage(r.message);
            });
          }}
        >
          <label htmlFor="confirm-delete" className="text-[13px] font-medium text-moss">
            Type DELETE
          </label>
          <input
            id="confirm-delete"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            autoComplete="off"
            autoCapitalize="characters"
            className="mt-1.5 h-12 w-full rounded-xl border-[1.5px] border-rule bg-ledger px-4 text-base text-bone focus:border-brass focus:outline-none"
          />
          <Button type="submit" variant="secondary" className="mt-3" disabled={pending || confirm.trim() !== "DELETE"}>
            {pending ? "Deleting…" : "Delete my account"}
          </Button>
          <p className="mt-2 min-h-5 text-sm text-bone" role="status" aria-live="polite">
            {message}
          </p>
        </form>
      </section>
    </>
  );
}

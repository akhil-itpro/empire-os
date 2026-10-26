"use client";

import { useState, useTransition } from "react";
import { deleteAccount } from "@/app/actions/account";
import { Button, ButtonLink } from "@/components/ui/Button";

export function DataControls() {
  const [confirm, setConfirm] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [deleted, setDeleted] = useState(false);
  const [pending, startTransition] = useTransition();
  const [downloading, setDownloading] = useState(false);
  const [downloadMessage, setDownloadMessage] = useState<string | null>(null);

  // Fetch first, so a failure shows a clear message here instead of a broken file.
  const download = async () => {
    setDownloading(true);
    setDownloadMessage(null);
    try {
      const res = await fetch("/me/data/export", { cache: "no-store" });
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { error?: string } | null;
        setDownloadMessage(body?.error ?? "We couldn't collect your data just now, so nothing was downloaded. Try again in a minute.");
        return;
      }
      const url = URL.createObjectURL(await res.blob());
      const link = document.createElement("a");
      link.href = url;
      link.download = "empire-os-my-data.json";
      document.body.append(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 10_000);
      setDownloadMessage("Downloaded: empire-os-my-data.json.");
    } catch {
      setDownloadMessage("You seem to be offline, so nothing was downloaded. Try again when you're connected.");
    } finally {
      setDownloading(false);
    }
  };

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
        <Button variant="secondary" className="mt-4" disabled={downloading} onClick={download}>
          {downloading ? "Collecting your data…" : "Download my data"}
        </Button>
        <p className="mt-2 min-h-5 text-sm text-bone" role="status" aria-live="polite">
          {downloadMessage}
        </p>
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

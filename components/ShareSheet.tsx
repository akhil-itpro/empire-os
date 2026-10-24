"use client";

import { useEffect, useState, useTransition } from "react";
import { setShareName } from "@/app/actions/growth";
import { Button } from "@/components/ui/Button";
import { Sheet } from "@/components/ui/Sheet";
import { track } from "@/lib/analytics/track";
import { cn } from "@/lib/cn";
import type { ShareKind } from "@/lib/share/kinds";
import type { ShareName } from "@/lib/server/store";

type Props = {
  /** The card to show, or null when the sheet is closed. */
  kind: ShareKind | null;
  title: string;
  firstName: string;
  shareName: ShareName;
  referralCode: string;
  onClose: () => void;
};

type Loaded = { key: string; url: string; blob: Blob };

/**
 * A share card (a 1080 x 1920 PNG made on the server), shared through the phone's
 * share sheet, with "Save image" as the fallback. Initials unless the student
 * chooses their first name.
 */
export function ShareSheet({ kind, title, firstName, shareName, referralCode, onClose }: Props) {
  const [name, setName] = useState<ShareName>(shareName);
  const [version, setVersion] = useState(0);
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [failed, setFailed] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const key = `${kind}|${version}`;
  const image = loaded?.key === key ? loaded : null;

  useEffect(() => {
    if (!kind) return;
    let cancelled = false;
    let url: string | null = null;
    void (async () => {
      try {
        const res = await fetch(`/api/share/${kind}?v=${version}`, { cache: "no-store" });
        if (!res.ok) throw new Error(String(res.status));
        const blob = await res.blob();
        if (cancelled) return;
        url = URL.createObjectURL(blob);
        setLoaded({ key: `${kind}|${version}`, url, blob });
        track("share_card_created", { kind });
      } catch {
        if (!cancelled) setFailed(`${kind}|${version}`);
      }
    })();
    return () => {
      cancelled = true;
      if (url) URL.revokeObjectURL(url);
    };
  }, [kind, version]);

  const fileName = `empire-os-${kind}.png`;

  const download = (blobUrl: string) => {
    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = fileName;
    a.click();
    track("share_click", { kind: kind ?? "", method: "download" });
    setNote("Saved. Post it from your photos.");
  };

  const share = async () => {
    if (!image) return;
    const file = new File([image.blob], fileName, { type: "image/png" });
    if (!navigator.canShare?.({ files: [file] })) {
      download(image.url);
      return;
    }
    try {
      await navigator.share({ files: [file], text: `Start your season: ${window.location.origin}/r/${referralCode}` });
      track("share_click", { kind: kind ?? "", method: "share" });
    } catch (error) {
      // Closing the share sheet isn't a failure; anything else falls back to saving.
      if ((error as Error).name !== "AbortError") download(image.url);
    }
  };

  const chooseName = (value: ShareName) =>
    startTransition(async () => {
      const r = await setShareName(value);
      if (r.ok) {
        setName(value);
        setVersion((v) => v + 1);
      } else setNote(r.message);
    });

  const initials = `${(Array.from(firstName.trim())[0] ?? "").toUpperCase()}.`;
  const close = () => {
    setNote(null);
    onClose();
  };

  return (
    <Sheet open={kind !== null} onClose={close} title={title}>
      <div className="flex justify-center">
        {image ? (
          // A blob URL made in the browser; next/image can't optimise it.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={image.url}
            alt={`Your share card: ${title}`}
            width={200}
            height={356}
            className="h-[356px] w-[200px] rounded-xl border border-rule"
          />
        ) : (
          <div className="flex h-[356px] w-[200px] items-center justify-center rounded-xl border border-rule bg-field px-4 text-center text-sm text-moss">
            <span role="status">{failed === key ? "The card didn't load. Close this and try again." : "Making your card…"}</span>
          </div>
        )}
      </div>

      <fieldset className="mt-5">
        <legend className="text-sm font-bold">Name on the card</legend>
        <div className="mt-2 flex gap-2">
          {(
            [
              ["initials", `Initials (${initials})`],
              ["first_name", `First name (${firstName})`],
            ] as const
          ).map(([value, label]) => (
            <label
              key={value}
              className={cn(
                "flex min-h-11 flex-1 cursor-pointer items-center justify-center rounded-xl border-[1.5px] px-3 text-center text-sm font-semibold has-focus-visible:outline-2 has-focus-visible:outline-brass",
                name === value ? "border-brass bg-raised" : "border-rule hov:bg-raised",
              )}
            >
              <input
                type="radio"
                name="share-name"
                value={value}
                checked={name === value}
                disabled={pending}
                onChange={() => chooseName(value)}
                className="sr-only"
              />
              {label}
            </label>
          ))}
        </div>
        <p className="mt-1.5 text-[13px] text-moss">Never your email, city or journal.</p>
      </fieldset>

      <div className="mt-5 flex flex-col gap-2.5">
        <Button onClick={share} disabled={!image || pending}>
          Share card
        </Button>
        <Button variant="secondary" onClick={() => image && download(image.url)} disabled={!image || pending}>
          Save image
        </Button>
      </div>
      <p className="mt-2 min-h-5 text-sm text-bone" role="status" aria-live="polite">
        {note}
      </p>
    </Sheet>
  );
}

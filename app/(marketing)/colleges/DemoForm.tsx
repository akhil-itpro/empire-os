"use client";

import Link from "next/link";
import { useState, useTransition, type ReactNode } from "react";
import { bookDemo } from "@/app/actions/demo";
import { Button } from "@/components/ui/Button";
import { BATCH_SIZES, DEMO_ROLES } from "@/lib/demo-options";

const input =
  "h-13 w-full rounded-xl border-[1.5px] border-rule bg-ledger px-4 text-base text-bone placeholder:text-moss/70";

function Field({ id, label, hint, children }: { id: string; label: string; hint?: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-semibold">
        {label}
      </label>
      {children}
      {hint ? <p className="text-[13px] text-moss">{hint}</p> : null}
    </div>
  );
}

/** "Book a 20-minute demo": work contact details only, saved for the founder. */
export function DemoForm() {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [done, setDone] = useState<{ name: string; email: string } | null>(null);

  if (done) {
    return (
      <div role="status" className="rounded-xl border-[1.5px] border-brass-deep bg-ledger px-5 py-5">
        <p className="font-display text-[26px] leading-none font-extrabold">Thanks, {done.name}.</p>
        <p className="mt-2 text-[15px] text-moss">
          We&apos;ll email you at <span className="text-bone">{done.email}</span> to fix a time for the demo.
        </p>
      </div>
    );
  }

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        const f = new FormData(e.currentTarget);
        const data = Object.fromEntries(
          ["name", "role", "college", "city", "email", "phone", "batchSize", "note", "website"].map((k) => [k, String(f.get(k) ?? "")]),
        );
        setMessage(null);
        startTransition(async () => {
          const r = await bookDemo(data);
          if (r.ok) setDone({ name: data.name.trim().split(" ")[0], email: data.email.trim() });
          else setMessage(r.message);
        });
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="demo-name" label="Your name">
          <input id="demo-name" name="name" required minLength={2} maxLength={80} autoComplete="name" className={input} />
        </Field>
        <Field id="demo-role" label="Your role">
          <select id="demo-role" name="role" required defaultValue="" className={input}>
            <option value="" disabled>
              Choose your role
            </option>
            {DEMO_ROLES.map((r) => (
              <option key={r.id} value={r.id}>
                {r.label}
              </option>
            ))}
          </select>
        </Field>
        <Field id="demo-college" label="College">
          <input id="demo-college" name="college" required minLength={2} maxLength={120} autoComplete="organization" className={input} />
        </Field>
        <Field id="demo-city" label="City">
          <input id="demo-city" name="city" required minLength={2} maxLength={60} autoComplete="address-level2" className={input} />
        </Field>
        <Field id="demo-email" label="Work email">
          <input id="demo-email" name="email" type="email" required maxLength={254} autoComplete="email" className={input} />
        </Field>
        <Field id="demo-phone" label="Phone (optional)">
          <input id="demo-phone" name="phone" type="tel" maxLength={20} autoComplete="tel" className={input} />
        </Field>
        <Field id="demo-batch" label="Students in your final-year batch">
          <select id="demo-batch" name="batchSize" required defaultValue="" className={input}>
            <option value="" disabled>
              Choose a range
            </option>
            {BATCH_SIZES.map((b) => (
              <option key={b.id} value={b.id}>
                {b.label}
              </option>
            ))}
          </select>
        </Field>
      </div>
      <Field id="demo-note" label="Anything we should know? (optional)">
        <textarea
          id="demo-note"
          name="note"
          maxLength={500}
          rows={3}
          className="w-full rounded-xl border-[1.5px] border-rule bg-ledger px-4 py-3 text-base text-bone"
        />
      </Field>
      {/* Hidden from people; bots fill it in. */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label htmlFor="demo-website">Website</label>
        <input id="demo-website" name="website" tabIndex={-1} autoComplete="off" />
      </div>
      {message ? (
        <p role="alert" className="text-sm text-bone">
          {message}
        </p>
      ) : null}
      <Button type="submit" disabled={pending} className="sm:max-w-[340px]">
        {pending ? "Sending" : "Book a 20-minute demo"}
      </Button>
      <p className="text-[13px] text-moss">
        We use these details only to arrange the demo. See the{" "}
        <Link href="/privacy" className="font-semibold text-brass hov:text-brass-light">
          Privacy Policy
        </Link>
        .
      </p>
    </form>
  );
}

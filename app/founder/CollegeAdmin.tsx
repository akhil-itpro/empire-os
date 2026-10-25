"use client";

import Link from "next/link";
import { useState, type FormEvent, type ReactNode } from "react";
import { createBatch, createOrg, createSampleBatch, createTpoInvite } from "@/app/actions/college";
import { Button } from "@/components/ui/Button";
import { CopyButton } from "@/app/college/CopyButton";

export type CollegeListItem = {
  org: { id: string; name: string; city: string | null };
  admins: number;
  batches: {
    id: string;
    name: string;
    startsOn: string;
    endsOn: string;
    joinCode: string;
    members: number;
    grantsPass: boolean;
    isSample: boolean;
  }[];
};

const input = "h-11 w-full rounded-[10px] border border-rule bg-field px-3 text-sm text-bone";
const label = "text-[13px] font-semibold text-moss";

function Field({ id, text, children }: { id: string; text: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className={label}>
        {text}
      </label>
      {children}
    </div>
  );
}

type Outcome = { ok: true } | { ok: false; message: string };

function useSubmit() {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const run = async (task: () => Promise<Outcome>, done?: string) => {
    setBusy(true);
    setMessage(null);
    const r = await task();
    setBusy(false);
    setMessage(r.ok ? (done ?? null) : r.message);
    return r.ok;
  };
  return { busy, message, run };
}

/** Founder HQ: colleges, batches and TPO invites (docs/PRODUCT.md sections 9 and 10). */
export function CollegeAdmin({ colleges }: { colleges: CollegeListItem[] }) {
  const orgForm = useSubmit();
  const batchForm = useSubmit();
  const inviteForm = useSubmit();
  const sampleForm = useSubmit();
  const [invite, setInvite] = useState<{ link: string; expiresOn: string } | null>(null);
  const batches = colleges.flatMap((c) => c.batches);
  const students = batches.filter((b) => !b.isSample).reduce((s, b) => s + b.members, 0);

  const addOrg = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const f = new FormData(form);
    void orgForm.run(async () => {
      const r = await createOrg({ name: String(f.get("name") ?? ""), city: String(f.get("city") ?? "") });
      if (r.ok) form.reset();
      return r;
    }, "College added.");
  };

  const addBatch = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const f = new FormData(form);
    void batchForm.run(async () => {
      const r = await createBatch({
        orgId: String(f.get("orgId") ?? ""),
        name: String(f.get("name") ?? ""),
        startsOn: String(f.get("startsOn") ?? ""),
        endsOn: String(f.get("endsOn") ?? ""),
        sections: String(f.get("sections") ?? ""),
        grantsPass: f.get("grantsPass") === "on",
      });
      if (r.ok) form.reset();
      return r;
    }, "Batch added. Its join code is in the list.");
  };

  const addInvite = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setInvite(null);
    void inviteForm.run(async () => {
      const r = await createTpoInvite({ orgId: String(f.get("orgId") ?? ""), label: String(f.get("label") ?? "") });
      if (r.ok) setInvite({ link: `${window.location.origin}/college/invite/${r.data.token}`, expiresOn: r.data.expiresOn });
      return r;
    });
  };

  const collegeOptions = colleges.map((c) => (
    <option key={c.org.id} value={c.org.id}>
      {c.org.name}
    </option>
  ));

  return (
    <div>
      <p className="text-sm text-moss">
        {colleges.length} {colleges.length === 1 ? "college" : "colleges"}, {batches.length}{" "}
        {batches.length === 1 ? "batch" : "batches"}, {students} {students === 1 ? "student" : "students"} in real batches.
      </p>

      {colleges.length > 0 ? (
        <ul className="mt-3 flex flex-col gap-3">
          {colleges.map((c) => (
            <li key={c.org.id} className="rounded-xl border border-rule px-3.5 py-3">
              <p className="text-[15px] font-semibold">
                {c.org.name}
                {c.org.city ? <span className="font-normal text-moss">, {c.org.city}</span> : null}
              </p>
              <p className="text-[13px] text-moss">
                {c.admins} College HQ {c.admins === 1 ? "admin" : "admins"}
              </p>
              {c.batches.length > 0 ? (
                <ul className="mt-2 flex flex-col gap-1 text-sm">
                  {c.batches.map((b) => (
                    <li key={b.id}>
                      <span className="font-semibold">{b.name}</span>
                      <span className="text-moss">
                        {" "}
                        {b.startsOn} to {b.endsOn}, code <span className="font-semibold text-bone">{b.joinCode}</span>,{" "}
                        {b.isSample ? "sample data" : `${b.members} joined`}
                        {b.grantsPass ? ", paid (Season Pass access)" : ""}
                      </span>
                      {b.isSample ? (
                        <>
                          {" "}
                          <Link href={`/college/${b.id}`} className="font-semibold text-brass hov:text-brass-light">
                            Open the demo
                          </Link>
                        </>
                      ) : null}
                    </li>
                  ))}
                </ul>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}

      <div className="mt-5 grid gap-5 md:grid-cols-2">
        <form onSubmit={addOrg} className="flex flex-col gap-2.5" aria-label="Add a college">
          <h3 className="text-base font-bold">Add a college</h3>
          <Field id="org-name" text="College name">
            <input id="org-name" name="name" required minLength={2} maxLength={80} className={input} />
          </Field>
          <Field id="org-city" text="City (optional)">
            <input id="org-city" name="city" maxLength={40} className={input} />
          </Field>
          <Button type="submit" variant="secondary" disabled={orgForm.busy}>
            Add college
          </Button>
          {orgForm.message ? <p role="status" className="text-sm">{orgForm.message}</p> : null}
        </form>

        <form onSubmit={addBatch} className="flex flex-col gap-2.5" aria-label="Add a batch">
          <h3 className="text-base font-bold">Add a batch</h3>
          <Field id="batch-org" text="College">
            <select id="batch-org" name="orgId" required className={input} defaultValue="">
              <option value="" disabled>
                Choose a college
              </option>
              {collegeOptions}
            </select>
          </Field>
          <Field id="batch-name" text="Batch name">
            <input id="batch-name" name="name" required minLength={2} maxLength={60} placeholder="CSE 2027 batch" className={input} />
          </Field>
          <div className="grid grid-cols-2 gap-2.5">
            <Field id="batch-start" text="Season starts">
              <input id="batch-start" name="startsOn" type="date" required className={input} />
            </Field>
            <Field id="batch-end" text="Season ends">
              <input id="batch-end" name="endsOn" type="date" required className={input} />
            </Field>
          </div>
          <Field id="batch-sections" text="Sections, separated by commas (optional)">
            <input id="batch-sections" name="sections" maxLength={400} placeholder="CSE-A, CSE-B, CSE-C" className={input} />
          </Field>
          <label className="flex min-h-11 items-center gap-2.5 text-sm">
            <input type="checkbox" name="grantsPass" className="size-5 accent-brass" />
            Paid batch: students get Season Pass access for these dates
          </label>
          <Button type="submit" variant="secondary" disabled={batchForm.busy || colleges.length === 0}>
            Add batch
          </Button>
          {batchForm.message ? <p role="status" className="text-sm">{batchForm.message}</p> : null}
        </form>

        <form onSubmit={addInvite} className="flex flex-col gap-2.5" aria-label="Invite a TPO">
          <h3 className="text-base font-bold">Invite a TPO</h3>
          <Field id="invite-org" text="College">
            <select id="invite-org" name="orgId" required className={input} defaultValue="">
              <option value="" disabled>
                Choose a college
              </option>
              {collegeOptions}
            </select>
          </Field>
          <Field id="invite-label" text="Note for yourself (optional)">
            <input id="invite-label" name="label" maxLength={80} placeholder="Dr. Rao, TPO" className={input} />
          </Field>
          <Button type="submit" variant="secondary" disabled={inviteForm.busy || colleges.length === 0}>
            Create invite link
          </Button>
          {inviteForm.message ? <p role="status" className="text-sm">{inviteForm.message}</p> : null}
          {invite ? (
            <div className="rounded-xl border border-brass-deep px-3.5 py-3">
              <p className="text-sm">One-time link, valid until {invite.expiresOn}. Copy it now: it isn&apos;t shown again.</p>
              <p className="mt-2 text-sm font-semibold break-all" data-testid="tpo-invite-link">
                {invite.link}
              </p>
              <div className="mt-2">
                <CopyButton value={invite.link} label="Copy link" />
              </div>
            </div>
          ) : null}
        </form>

        <div className="flex flex-col gap-2.5">
          <h3 className="text-base font-bold">Demo for a TPO</h3>
          <p className="text-sm text-moss">
            Creates a sample college and batch with generated students, labelled &quot;Sample data&quot; everywhere, with you
            as its admin. Nothing real is mixed in.
          </p>
          <Button
            variant="secondary"
            disabled={sampleForm.busy}
            onClick={() => void sampleForm.run(createSampleBatch, "Sample batch created. Open the demo from the list.")}
          >
            Create a sample batch
          </Button>
          {sampleForm.message ? <p role="status" className="text-sm">{sampleForm.message}</p> : null}
        </div>
      </div>
    </div>
  );
}

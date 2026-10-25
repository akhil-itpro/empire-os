import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { studentNudge } from "@/lib/server/college-service";
import { depsFor } from "@/lib/server/deps";
import { loadHq } from "@/lib/server/hq";
import { getSessionUserId } from "@/lib/server/session";
import { hqWarRoom } from "@/lib/server/war-room-service";
import { HqView } from "./HqView";
import { NudgeBanner } from "./NudgeBanner";
import { WarRoomCards } from "./WarRoomCards";

export const metadata: Metadata = { title: "HQ", robots: { index: false } };

export default function HqPage({ searchParams }: PageProps<"/hq">) {
  return (
    <Suspense fallback={<HqSkeleton />}>
      <HqContent searchParams={searchParams} />
    </Suspense>
  );
}

async function HqContent({ searchParams }: { searchParams: PageProps<"/hq">["searchParams"] }) {
  // HQ depends on the student's clock ("today"), so it renders per visit.
  await connection();
  const userId = await getSessionUserId();
  if (!userId) redirect("/login");
  const deps = await depsFor(userId);
  const result = await loadHq(deps, userId);
  if (!result.ok) redirect(result.error === "not_started" ? "/quiz" : "/login");
  const first = (await searchParams).first === "1";
  const [nudge, warRoom] = await Promise.all([studentNudge(deps, userId), hqWarRoom(deps, userId)]);
  return (
    <>
      {nudge ? <NudgeBanner id={nudge.id} orgName={nudge.orgName} /> : null}
      <HqView
        data={result.data}
        first={first}
        extras={<WarRoomCards dueWeek={result.data.seasonFinished ? null : warRoom.dueWeek} boss={warRoom.boss} />}
      />
    </>
  );
}

function HqSkeleton() {
  return (
    <main className="px-5 pt-4" aria-busy="true">
      <div className="h-[52px] w-40 rounded-lg bg-ledger" />
      <div className="mt-5 flex gap-4">
        <div className="size-[156px] rounded-full bg-ledger" />
        <div className="flex-1 space-y-4 pt-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-5 rounded bg-ledger" />
          ))}
        </div>
      </div>
      <div className="mt-8 space-y-2.5">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-[104px] rounded-xl bg-ledger" />
        ))}
      </div>
      <p className="sr-only">Loading HQ</p>
    </main>
  );
}

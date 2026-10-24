import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { paywallSource } from "@/lib/game/pass";
import { depsFor } from "@/lib/server/deps";
import { loadPass } from "@/lib/server/pass-service";
import { getSessionUserId } from "@/lib/server/session";
import { PassView } from "./PassView";

export const metadata: Metadata = { title: "Season Pass", robots: { index: false } };

export default function PassPage({ searchParams }: PageProps<"/pass">) {
  return (
    <Suspense fallback={<main className="min-h-dvh" aria-busy="true" />}>
      <PassContent searchParams={searchParams} />
    </Suspense>
  );
}

async function PassContent({ searchParams }: { searchParams: PageProps<"/pass">["searchParams"] }) {
  await connection();
  const userId = await getSessionUserId();
  if (!userId) redirect("/login");
  const result = await loadPass(await depsFor(userId), userId);
  if (!result.ok) redirect("/quiz");
  const source = paywallSource((await searchParams).from);
  return <PassView data={result.data} source={source} />;
}

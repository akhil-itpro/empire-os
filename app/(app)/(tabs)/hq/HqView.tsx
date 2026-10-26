"use client";

import { Flame } from "lucide-react";
import { animate, AnimatePresence, motion, useReducedMotion } from "motion/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, useTransition, type ReactNode } from "react";
import {
  chooseFreePillar,
  completeMission,
  skipMission,
  swapMission,
  undoMission,
} from "@/app/actions/season";
import { Moment, type MomentKind } from "@/components/Moment";
import { ShareSheet } from "@/components/ShareSheet";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { RankIcon } from "@/components/ui/icons";
import { MEDAL_TICKS, MedalBadge } from "@/components/ui/MedalBadge";
import { Medallion } from "@/components/ui/Medallion";
import { Meter } from "@/components/ui/Meter";
import { OptionTile } from "@/components/ui/OptionTile";
import { Ticket } from "@/components/ui/Ticket";
import { cn } from "@/lib/cn";
import { ACT_NAMES } from "@/lib/game/dates";
import { MEDALS_BY_ID, type MedalId } from "@/lib/game/medals";
import { DAY_COMPLETE_BONUS, type SkipReason } from "@/lib/game/rules";
import { takeUninvitedPaywall } from "@/lib/paywall";
import { PILLAR_CLASSES, PILLAR_LABEL, PILLARS, type Pillar } from "@/lib/pillars";
import type { HqData, TicketData } from "@/lib/server/hq";
import { STREAK_CARD_DAYS, type ShareKind } from "@/lib/share/kinds";
import { InstallTip } from "./InstallTip";
import { MissionSheet } from "./MissionSheet";
import { TrialBanner } from "./TrialBanner";

const nf = new Intl.NumberFormat("en-IN");
const ACT_LABEL = { 1: "Act I", 2: "Act II", 3: "Act III" } as const;

const CARD_TITLES: Record<ShareKind, string> = {
  archetype: "Your archetype",
  rank: "Your new rank",
  "streak-7": "7-day streak",
  "streak-30": "30-day streak",
  "streak-60": "60-day streak",
  "streak-90": "90-day streak",
  season: "Season complete",
};

/** The image card for a moment: rank-ups and the 7, 30, 60 and 90-day streaks have one. */
function cardFor(moment: MomentKind): ShareKind | null {
  if (moment.kind === "rank") return "rank";
  return (STREAK_CARD_DAYS as readonly number[]).includes(moment.days) ? (`streak-${moment.days}` as ShareKind) : null;
}

function without<T>(obj: Record<string, T>, key: string) {
  const copy = { ...obj };
  delete copy[key];
  return copy;
}

/** Counts the XP number up to its new value (instant with reduced motion). */
function useCountUp(value: number) {
  const reduceMotion = useReducedMotion();
  const [shown, setShown] = useState(value);
  const from = useRef(value);
  useEffect(() => {
    if (reduceMotion || from.current === value) {
      from.current = value;
      return;
    }
    const controls = animate(from.current, value, {
      duration: 0.7,
      ease: "easeOut",
      onUpdate: (v) => setShown(Math.round(v)),
    });
    from.current = value;
    return () => controls.stop();
  }, [value, reduceMotion]);
  return reduceMotion ? value : shown;
}

/** Lights a new medal's ring tick by tick (all at once with reduced motion). */
function useLightUp(total: number) {
  const reduceMotion = useReducedMotion();
  const [lit, setLit] = useState(0);
  useEffect(() => {
    if (reduceMotion) return;
    const controls = animate(0, total, { duration: 0.7, ease: "easeOut", onUpdate: (v) => setLit(Math.round(v)) });
    return () => controls.stop();
  }, [total, reduceMotion]);
  return reduceMotion ? total : lit;
}

function MedalEarned({ id }: { id: MedalId }) {
  const medal = MEDALS_BY_ID.get(id)!;
  const lit = useLightUp(MEDAL_TICKS);
  return (
    <div className="flex items-center gap-3.5 rounded-xl border border-rule bg-ledger px-4 py-3">
      <MedalBadge id={id} earned lit={lit} size={56} />
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-moss">Medal earned</p>
        <p className="text-base font-semibold">{medal.name}</p>
        <p className="text-[13px] text-moss">{medal.how}</p>
      </div>
    </div>
  );
}

/**
 * A short note above the bottom bar when medals are earned, since the cards that
 * record them sit below the missions. Visual only and tap-through: it never covers
 * a button, and screen readers hear the cards' live region instead.
 */
function MedalToast({ ids, onDone }: { ids: MedalId[]; onDone: () => void }) {
  const reduceMotion = useReducedMotion();
  useEffect(() => {
    const t = setTimeout(onDone, 3500);
    return () => clearTimeout(t);
  }, [onDone]);
  const names = ids.map((id) => MEDALS_BY_ID.get(id)!.name);
  return (
    <motion.div
      aria-hidden="true"
      initial={reduceMotion ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="pointer-events-none fixed inset-x-0 bottom-[calc(88px+env(safe-area-inset-bottom))] z-20 mx-auto w-[calc(100%-40px)] max-w-[440px]"
    >
      <div className="flex items-center gap-3 rounded-xl border-[1.5px] border-brass bg-raised px-3.5 py-2.5">
        <MedalBadge id={ids[0]} earned size={40} />
        <p className="text-sm">
          <span className="text-moss">{names.length === 1 ? "Medal earned: " : "Medals earned: "}</span>
          <span className="font-semibold">{names.join(" and ")}</span>
        </p>
      </div>
    </motion.div>
  );
}

/** Today's missions all done: a ticket with the day, the bonus, the streak and the XP earned. */
function DayComplete({ day, missions, streak }: { day: number; missions: TicketData[]; streak: number }) {
  const reduceMotion = useReducedMotion();
  const xp = missions.reduce((sum, m) => sum + (m.status === "done" ? m.xp : 0), 0) + DAY_COMPLETE_BONUS;
  const count = missions.length === 3 ? "All three missions" : missions.length === 1 ? "Today's mission" : `All ${missions.length} missions`;
  return (
    <motion.section
      aria-labelledby="day-complete"
      initial={reduceMotion ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.15 }}
      className="relative flex min-h-[104px] rounded-xl border-[1.5px] border-brass bg-ledger [--notch:var(--color-field)]"
    >
      <div className="flex min-w-0 flex-1 flex-col justify-center py-3.5 pr-3 pl-4">
        <h2 id="day-complete" className="font-display text-[26px] leading-none font-extrabold">
          Day {day} complete
        </h2>
        <p className="mt-1.5 text-sm text-moss">
          {count} done. Bonus +{DAY_COMPLETE_BONUS} XP.
        </p>
        {streak >= 2 ? (
          <p className="mt-2 flex items-center gap-1.5 text-sm font-semibold">
            <Flame size={16} strokeWidth={1.9} className="text-brass" aria-hidden="true" />
            {streak} days in a row
          </p>
        ) : null}
      </div>
      <div className="relative flex w-[92px] flex-none flex-col items-center justify-center border-l-2 border-dashed border-rule">
        <span className="absolute -top-[9.5px] -left-[9px] size-4 rounded-full bg-(--notch)" />
        <span className="absolute -bottom-[9.5px] -left-[9px] size-4 rounded-full bg-(--notch)" />
        <span className="text-xl font-bold text-brass">+{xp}</span>
        <span className="text-center text-xs leading-tight font-semibold text-moss">XP with bonus</span>
      </div>
    </motion.section>
  );
}

export function HqView({ data, first, extras }: { data: HqData; first: boolean; extras?: ReactNode }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  // Missions marked done here before the server answers, so the stamp is instant.
  const [optimistic, setOptimistic] = useState<Record<string, "done" | "assigned">>({});
  const [openId, setOpenId] = useState<string | null>(null);
  const [moments, setMoments] = useState<MomentKind[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [shareKind, setShareKind] = useState<ShareKind | null>(null);
  // The "+45" that rises next to the XP total, and medals earned on this visit.
  const [gain, setGain] = useState<{ key: number; xp: number } | null>(null);
  const [medalsNow, setMedalsNow] = useState<MedalId[]>([]);
  const [toast, setToast] = useState<{ key: number; ids: MedalId[] } | null>(null);
  const hideToast = useCallback(() => setToast(null), []);
  const reduceMotion = useReducedMotion();

  const missions = data.missions.map((m) => (optimistic[m.id] ? { ...m, status: optimistic[m.id] } : m));
  const doneCount = missions.filter((m) => m.status === "done").length;
  const xpShown = useCountUp(data.xp);
  const open = missions.find((m) => m.id === openId) ?? null;

  // The one uninvited paywall: the first visit after full access ends.
  useEffect(() => {
    if (data.offerPaywall && takeUninvitedPaywall()) router.push("/pass?from=trial_end");
  }, [data.offerPaywall, router]);

  const run = (work: () => Promise<void>) => startTransition(work);

  const complete = (m: TicketData) => {
    setOpenId(null);
    setOptimistic((o) => ({ ...o, [m.id]: "done" }));
    run(async () => {
      const r = await completeMission(m.id);
      setOptimistic((o) => without(o, m.id));
      if (!r.ok) {
        setMessage(r.message);
        return;
      }
      if (r.data.xpGained > 0) setGain({ key: Date.now(), xp: r.data.xpGained });
      if (r.data.medals.length) {
        setMedalsNow((list) => [...list, ...r.data.medals.filter((id) => !list.includes(id))]);
        setToast({ key: Date.now(), ids: r.data.medals });
      }
      const queued: MomentKind[] = [];
      if (r.data.rankUp) queued.push({ kind: "rank", rank: r.data.rankUp });
      if (r.data.streakMilestone) queued.push({ kind: "streak", days: r.data.streakMilestone });
      if (queued.length) setMoments((q) => [...q, ...queued]);
      if (r.data.referralReward) {
        setMessage("Three active days. You and the friend who invited you each get 7 days of full access.");
      }
    });
  };

  const undo = (m: TicketData) => {
    setOpenId(null);
    setOptimistic((o) => ({ ...o, [m.id]: "assigned" }));
    run(async () => {
      const r = await undoMission(m.id);
      setOptimistic((o) => without(o, m.id));
      if (!r.ok) setMessage(r.message);
    });
  };

  const swap = (m: TicketData) =>
    run(async () => {
      const r = await swapMission(m.id);
      setOpenId(null);
      setMessage(r.ok ? "Swapped. Here's a new one." : r.message);
    });

  const skip = (m: TicketData, reason: SkipReason) =>
    run(async () => {
      const r = await skipMission(m.id, reason);
      setOpenId(null);
      setMessage(r.ok ? "Skipped. No guilt. Do the others if you can." : r.message);
    });

  const pickPillar = (p: Pillar) =>
    run(async () => {
      const r = await chooseFreePillar(p);
      if (!r.ok) setMessage(r.message);
    });

  return (
    <main className="pt-3.5">
      <header className="flex items-start justify-between px-5">
        <div>
          <div className="text-[13px] font-medium text-moss">Season {data.seasonNumber}</div>
          <div className="mt-0.5 flex items-baseline gap-1.5">
            <span className="font-stencil text-[38px] leading-none font-black text-brass">Day {data.day}</span>
            <span className="text-sm text-moss">of 90</span>
          </div>
        </div>
        <div className="mt-1.5 flex gap-2">
          <Chip
            emphasis
            srLabel="day streak"
            icon={<Flame size={18} strokeWidth={1.9} className="text-brass" aria-hidden="true" />}
          >
            {data.streak.current}
          </Chip>
          <Chip className="pl-2" srLabel="rank" icon={<RankIcon size={20} className="text-brass" />}>
            {data.rank.rank}
          </Chip>
        </div>
      </header>

      {data.seasonFinished ? null : (
        <p className="mx-5 mt-2.5 text-[13px] text-moss">
          Week {data.week} of 13: <span className="font-semibold text-bone">{data.weekTheme}</span>. {ACT_LABEL[data.act]},{" "}
          {ACT_NAMES[data.act]}.
        </p>
      )}

      {data.streak.state === "paused" ? (
        <p className="mx-5 mt-4 rounded-xl border border-rule bg-ledger px-4 py-3 text-sm text-bone">
          Streak paused. Your XP and rank are safe. Go again today.
        </p>
      ) : data.streak.state === "alive" && doneCount === 0 && !data.seasonFinished ? (
        <p className="mx-5 mt-4 flex items-center gap-2 text-sm text-bone">
          <Flame size={16} strokeWidth={1.9} className="flex-none text-brass" aria-hidden="true" />
          One mission today makes it {data.streak.current + 1} days in a row.
        </p>
      ) : null}

      <section className="mx-5 mt-4 flex items-center gap-[18px]" aria-label="Last 7 days">
        <Medallion total={100} lit={data.score ?? 0} size={156}>
          <span className="text-[50px] leading-none font-bold">{data.score ?? "–"}</span>
          <span className="mt-1 text-xs font-medium text-moss">Empire score</span>
          <span className="sr-only">
            {data.score === null ? "No missions finished in the last 7 days yet." : "out of 100, last 7 days"}
          </span>
        </Medallion>
        <div className="min-w-0 flex-1">
          <div className="text-xs font-medium text-moss">Missions done, last 7 days</div>
          <ul className="mt-2.5 flex flex-col gap-[11px]">
            {PILLARS.map((p) => (
              <li key={p}>
                <Meter tone={p} value={data.pillars[p] ?? 0} valueText={data.pillars[p] === null ? "–" : `${data.pillars[p]}%`} />
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="mx-5 mt-5" aria-label="XP">
        <div className="flex items-baseline justify-between">
          <span className="flex items-baseline gap-2">
            <span className="text-[15px] font-bold" aria-live="polite">
              {nf.format(xpShown)} XP
            </span>
            {gain && !reduceMotion ? (
              <motion.span
                key={gain.key}
                aria-hidden="true"
                className="text-[15px] font-bold text-brass"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: [0, 1, 1, 0], y: [8, 0, 0, -6] }}
                transition={{ duration: 1.6, times: [0, 0.15, 0.7, 1], ease: "easeOut" }}
              >
                +{gain.xp}
              </motion.span>
            ) : null}
          </span>
          <span className="text-[13px] text-moss">
            {data.rank.next ? `${nf.format(data.rank.toNext)} XP to ${data.rank.next}` : "Top rank reached"}
          </span>
        </div>
        <Meter tone="brass" value={data.rank.percent} className="mt-2" />
      </section>

      {data.trialEndingSoon ? <TrialBanner /> : null}

      <div className="mx-5 mt-[22px] flex items-baseline justify-between">
        <h1 className="font-display text-[26px] leading-none font-extrabold">Today&apos;s missions</h1>
        {missions.length > 0 ? (
          <span className="text-[13px] text-moss">
            {doneCount} of {missions.length} done
          </span>
        ) : null}
      </div>

      {data.seasonFinished ? (
        <div className="mx-5 mt-3">
          <p className="text-base text-moss">Season {data.seasonNumber} is complete. Well played.</p>
          <Button variant="secondary" className="mt-4" onClick={() => setShareKind("season")}>
            Share your season
          </Button>
        </div>
      ) : missions.length === 0 && !data.fullAccess ? (
        <section className="mx-5 mt-3" aria-label="Pick today's pillar">
          <p className="text-[15px] text-moss">
            Your free week is over. Free stays free with one mission a day. Pick today&apos;s pillar.
          </p>
          <div className="mt-4 grid grid-cols-2 gap-3">
            {PILLARS.map((p) => (
              <OptionTile
                key={p}
                compact
                title={PILLAR_LABEL[p]}
                selected={false}
                disabled={pending}
                onClick={() => pickPillar(p)}
                icon={<span className={cn("block size-2.5 rounded-full", PILLAR_CLASSES[p].dot)} />}
              />
            ))}
          </div>
          <p className="mt-3 text-sm text-moss">
            Want all three back?{" "}
            <Link
              href="/pass?from=free_hq"
              className="inline-flex min-h-11 items-center font-semibold text-brass hov:text-brass-light"
            >
              See Season Pass
            </Link>
          </p>
        </section>
      ) : (
        <>
          {first && missions[0]?.status === "assigned" ? (
            <p className="mx-5 mt-3 text-[15px] font-semibold text-brass">
              Do this one now. It takes {missions[0].minutes} minutes.
            </p>
          ) : null}
          <ul className="mx-5 mt-3 flex flex-col gap-2.5">
            {missions.map((m, i) => (
              <li key={m.id}>
                <Ticket
                  pillar={m.pillar}
                  title={m.title}
                  minutes={m.minutes}
                  xp={m.xp}
                  done={m.status === "done"}
                  highlight={first && i === 0 && m.status === "assigned"}
                  pending={pending}
                  onComplete={m.status === "assigned" ? () => complete(m) : undefined}
                  onOpen={() => setOpenId(m.id)}
                  className={m.status === "skipped" ? "opacity-60" : undefined}
                />
                {m.status === "skipped" ? <p className="mt-1 text-xs text-moss">Skipped</p> : null}
              </li>
            ))}
          </ul>
        </>
      )}

      {data.dayComplete ? (
        <div className="mx-5 mt-3">
          <DayComplete day={data.day} missions={missions} streak={data.streak.current} />
          {data.tomorrow ? (
            <p className="mt-3 text-sm text-moss">
              Tomorrow starts with: <span className="font-semibold text-bone">{data.tomorrow.title}</span> (
              {PILLAR_LABEL[data.tomorrow.pillar]}, {data.tomorrow.minutes} min).
            </p>
          ) : null}
        </div>
      ) : null}

      <div aria-live="polite">
        {medalsNow.length > 0 ? (
          <section className="mx-5 mt-3" aria-label="Medals earned">
            <ul className="flex flex-col gap-2.5">
              {medalsNow.map((id) => (
                <li key={id}>
                  <MedalEarned id={id} />
                </li>
              ))}
            </ul>
            <Link
              href="/stats#medals"
              className="-mb-1.5 inline-flex min-h-11 items-center text-sm font-semibold text-brass hov:text-brass-light"
            >
              See all your medals
            </Link>
          </section>
        ) : null}
      </div>

      <p className="mx-5 mt-3 min-h-5 text-sm text-bone" role="status" aria-live="polite">
        {message}
      </p>

      <AnimatePresence>
        {toast ? <MedalToast key={toast.key} ids={toast.ids} onDone={hideToast} /> : null}
      </AnimatePresence>

      {extras}

      <MissionSheet
        mission={open}
        swapsLeft={data.swapsLeft}
        busy={pending}
        onClose={() => setOpenId(null)}
        onComplete={complete}
        onUndo={undo}
        onSwap={swap}
        onSkip={skip}
      />

      {moments[0] ? (
        <Moment
          key={JSON.stringify(moments[0])}
          moment={moments[0]}
          referralCode={data.referralCode}
          onClose={() => setMoments((q) => q.slice(1))}
          onShareCard={cardFor(moments[0]) ? () => setShareKind(cardFor(moments[0])) : undefined}
        />
      ) : null}

      <ShareSheet
        kind={shareKind}
        title={shareKind ? CARD_TITLES[shareKind] : ""}
        firstName={data.firstName}
        shareName={data.shareName}
        referralCode={data.referralCode}
        onClose={() => setShareKind(null)}
      />

      <InstallTip show={data.dayComplete} />
    </main>
  );
}

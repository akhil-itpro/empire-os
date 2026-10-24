"use client";

import { Briefcase, Dumbbell, Moon, Store, TrendingUp, Wallet } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { OptionTile } from "@/components/ui/OptionTile";
import { Sheet } from "@/components/ui/Sheet";
import { Ticket } from "@/components/ui/Ticket";
import { PILLAR_LABEL, PILLARS, type Pillar } from "@/lib/pillars";

// Sample missions for the style guide only. Real screens show real data.
const SAMPLE = [
  { id: "m1", pillar: "career", title: "Solve 2 easy aptitude sets", minutes: 20, xp: 45 },
  { id: "m2", pillar: "body", title: "20-minute push and pull circuit at home", minutes: 20, xp: 45 },
  { id: "m3", pillar: "money", title: "Find 3 money leaks in your UPI history", minutes: 10, xp: 30 },
] as const;

export function TicketDemo() {
  const [done, setDone] = useState<Record<string, boolean>>({ m1: true });
  const [openId, setOpenId] = useState<string | null>(null);
  const open = SAMPLE.find((m) => m.id === openId);

  return (
    <>
      <div className="flex flex-col gap-2.5">
        {SAMPLE.map((m) => (
          <Ticket
            key={m.id}
            pillar={m.pillar}
            title={m.title}
            minutes={m.minutes}
            xp={m.xp}
            done={!!done[m.id]}
            onComplete={() => setDone((d) => ({ ...d, [m.id]: true }))}
            onUndo={() => setDone((d) => ({ ...d, [m.id]: false }))}
            onOpen={() => setOpenId(m.id)}
          />
        ))}
      </div>
      <Sheet open={!!open} onClose={() => setOpenId(null)} title={open?.title ?? ""}>
        <p className="text-[15px] text-moss">
          The mission detail sheet. Swap and Skip arrive with the daily loop.
        </p>
        <div className="mt-5 flex flex-col gap-2">
          <Button variant="secondary" onClick={() => setOpenId(null)}>
            Close
          </Button>
        </div>
      </Sheet>
    </>
  );
}

export function HighlightTicketDemo() {
  const [done, setDone] = useState(false);
  return (
    <Ticket
      pillar="mind"
      title="Write tomorrow's top 3 before sleeping"
      minutes={5}
      xp={30}
      done={done}
      highlight={!done}
      onComplete={() => setDone(true)}
      onUndo={() => setDone(false)}
    />
  );
}

const GOALS = [
  { id: "job", title: "Get my first job", desc: "Placements, interviews, projects", Icon: Briefcase },
  { id: "earn", title: "Earn more or switch", desc: "New skills, a stronger profile", Icon: TrendingUp },
  { id: "side", title: "Build a side income", desc: "Freelance or a small business", Icon: Store },
  { id: "fit", title: "Get fit and strong", desc: "Home or gym training", Icon: Dumbbell },
  { id: "discipline", title: "Fix my discipline", desc: "Phone, sleep and routine", Icon: Moon },
  { id: "money", title: "Control my money", desc: "Budget, save, stop the leaks", Icon: Wallet },
];

export function OptionTileDemo() {
  const [picked, setPicked] = useState("job");
  return (
    <div className="grid grid-cols-2 gap-3">
      {GOALS.map(({ id, title, desc, Icon }) => (
        <OptionTile
          key={id}
          title={title}
          description={desc}
          icon={<Icon size={26} strokeWidth={1.75} aria-hidden="true" />}
          selected={picked === id}
          onClick={() => setPicked(id)}
        />
      ))}
    </div>
  );
}

export function PillarOrderDemo() {
  const [order, setOrder] = useState<Pillar[]>(["career", "mind"]);
  const toggle = (p: Pillar) =>
    setOrder((o) => (o.includes(p) ? o.filter((x) => x !== p) : [...o, p]));
  return (
    <div className="grid grid-cols-2 gap-3">
      {PILLARS.map((p) => {
        const index = order.indexOf(p);
        return (
          <OptionTile
            key={p}
            compact
            title={PILLAR_LABEL[p]}
            selected={index >= 0}
            badge={index >= 0 ? index + 1 : undefined}
            onClick={() => toggle(p)}
          />
        );
      })}
    </div>
  );
}

export function SheetDemo() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="secondary" onClick={() => setOpen(true)}>
        Open a sheet
      </Button>
      <Sheet open={open} onClose={() => setOpen(false)} title="Skip this mission?">
        <p className="text-[15px] text-moss">Pick a reason. It helps tune next week.</p>
        <div className="mt-4 flex flex-col gap-2">
          <Button variant="secondary" onClick={() => setOpen(false)}>No time</Button>
          <Button variant="secondary" onClick={() => setOpen(false)}>Not relevant</Button>
          <Button variant="secondary" onClick={() => setOpen(false)}>Too hard</Button>
          <Button variant="quiet" onClick={() => setOpen(false)}>Keep it</Button>
        </div>
      </Sheet>
    </>
  );
}

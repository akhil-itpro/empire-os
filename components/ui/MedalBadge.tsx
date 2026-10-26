import {
  CalendarCheck,
  CircleCheckBig,
  Compass,
  Crown,
  Flag,
  Grid2x2,
  Hourglass,
  Package,
  RotateCcw,
  ShieldCheck,
  Sunrise,
  Target,
  type LucideIcon,
} from "lucide-react";
import type { MedalId } from "@/lib/game/medals";
import { Medallion } from "./Medallion";

const ICONS: Record<MedalId, LucideIcon> = {
  first_mission: Flag,
  full_day: CircleCheckBig,
  early_start: Sunrise,
  comeback: RotateCcw,
  all_four: Grid2x2,
  war_room: Compass,
  clean_sweep: ShieldCheck,
  boss: Crown,
  ten_hours: Hourglass,
  fifty: Target,
  pack: Package,
  thirty_days: CalendarCheck,
};

export const MEDAL_TICKS = 36;

/**
 * A medal: a small medallion, its ring lit brass with a brass icon when earned,
 * unlit with a moss icon when not. The name and status are always shown as text
 * next to it, so the colour never carries the meaning alone.
 */
export function MedalBadge({
  id,
  earned,
  size = 64,
  lit,
}: {
  id: MedalId;
  earned: boolean;
  size?: number;
  /** Ticks lit, for the HQ light-up; defaults to all when earned, none when not. */
  lit?: number;
}) {
  const Icon = ICONS[id];
  return (
    <Medallion total={MEDAL_TICKS} lit={lit ?? (earned ? MEDAL_TICKS : 0)} size={size}>
      <Icon
        size={Math.round(size * 0.38)}
        strokeWidth={1.9}
        className={earned ? "text-brass" : "text-moss"}
        aria-hidden="true"
      />
    </Medallion>
  );
}

import type { ReactNode, SVGProps } from "react";
import type { Pillar } from "@/lib/pillars";

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function Svg({ size = 24, children, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  );
}

// Rank badge: a coin with two chevrons (HQ rank chip).
export function RankIcon(props: IconProps) {
  return (
    <Svg strokeWidth={1.6} {...props}>
      <circle cx="12" cy="12" r="9.5" />
      <path d="M7.5 11.5l4.5-3 4.5 3M7.5 15.5l4.5-3 4.5 3" />
    </Svg>
  );
}

// Pillar marks from the landing page. Drawn in the pillar colour via currentColor.
const PILLAR_PATHS: Record<Pillar, ReactNode> = {
  career: (
    <>
      <rect x="3" y="7" width="18" height="13" rx="2" />
      <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 13h18" />
    </>
  ),
  body: <path d="M6 7v10M3 9.5v5M18 7v10M21 9.5v5M6 12h12" />,
  mind: (
    <>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="12" cy="12" r="1" />
    </>
  ),
  money: (
    <>
      <rect x="3" y="6" width="18" height="14" rx="2" />
      <path d="M3 10h18M16 15h2" />
    </>
  ),
};

export function PillarIcon({ pillar, ...props }: IconProps & { pillar: Pillar }) {
  return <Svg {...props}>{PILLAR_PATHS[pillar]}</Svg>;
}

import { OG_SIZE, ogImage } from "@/lib/og";

export const alt = "College HQ by EMPIRE OS, for training and placement cells.";
export const size = OG_SIZE;
export const contentType = "image/png";

export default function Image() {
  return ogImage({
    eyebrow: "College HQ, for training and placement cells",
    title: "See who's preparing every day, not just on drive day.",
    line: "Daily missions for your students. Who's active, who needs a nudge, and a weekly report for your principal.",
  });
}

import { OG_SIZE, ogImage } from "@/lib/og";

export const alt = "EMPIRE OS: make the next 90 days your best season.";
export const size = OG_SIZE;
export const contentType = "image/png";

export default function Image() {
  return ogImage({
    eyebrow: "Free 2-minute quiz",
    title: "Make the next 90 days your best season.",
    line: "Three missions a day for your career, body, mind and money, planned around your timetable, budget and free time.",
  });
}

import { guideOgImage } from "@/components/GuideArticle";
import { OG_SIZE } from "@/lib/og";

export const alt = "An EMPIRE OS guide";
export const size = OG_SIZE;
export const contentType = "image/png";

export default function Image() {
  return guideOgImage("90-day-placement-preparation-plan");
}

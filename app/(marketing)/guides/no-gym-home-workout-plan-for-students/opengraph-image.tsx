import { guideOgImage } from "@/components/GuideArticle";
import { OG_SIZE } from "@/lib/og";

export const alt = "An EMPIRE OS guide";
export const size = OG_SIZE;
export const contentType = "image/png";

export default function Image() {
  return guideOgImage("no-gym-home-workout-plan-for-students");
}

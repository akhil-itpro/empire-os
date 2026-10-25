import type { Batch } from "@/lib/server/store";
import type { batchPosition } from "@/lib/server/college-metrics";

const dm = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", timeZone: "UTC" });
const long = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });

/** "13 Oct" */
export const dayMonth = (d: string) => dm.format(new Date(`${d}T00:00:00Z`));
/** "13 October 2026" */
export const longDate = (d: string) => long.format(new Date(`${d}T00:00:00Z`));

const students = (n: number) => (n === 1 ? "1 student" : `${n} students`);

/** The line under the batch name: where the season stands and who joined. */
export function seasonLine(batch: Pick<Batch, "startsOn" | "endsOn">, position: ReturnType<typeof batchPosition>, members: number) {
  if (!position.started) {
    return `The season starts on ${longDate(batch.startsOn)}. ${students(members)} joined with your batch code so far.`;
  }
  if (position.finished) {
    return `The season ended on ${longDate(batch.endsOn)}. ${students(members)} joined with your batch code.`;
  }
  return `Week ${position.week} of ${position.totalWeeks}. ${students(members)} joined with your batch code.`;
}

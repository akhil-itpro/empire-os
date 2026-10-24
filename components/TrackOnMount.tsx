"use client";

import { useEffect } from "react";
import { track, type ClientEvent } from "@/lib/analytics/track";

/** Logs one analytics event when a page first shows. Renders nothing. */
export function TrackOnMount({ name, props }: { name: ClientEvent; props?: Record<string, string | number | boolean> }) {
  useEffect(() => {
    track(name, props);
    // Only once per mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}

"use client";

import { useEffect } from "react";
import { savePendingBatchCode } from "@/lib/college-code";

/** Keeps the batch code in this browser, so Me can offer it after sign-up. */
export function RememberBatchCode({ code }: { code: string }) {
  useEffect(() => savePendingBatchCode(code), [code]);
  return null;
}

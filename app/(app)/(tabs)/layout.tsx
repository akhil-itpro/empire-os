import type { ReactNode } from "react";
import { BottomNav } from "@/components/ui/BottomNav";

// HQ, Path, Stats and Me share the bottom navigation.
export default function TabsLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <div className="mx-auto w-full max-w-[480px] pb-[calc(96px+env(safe-area-inset-bottom))]">{children}</div>
      <BottomNav />
    </>
  );
}

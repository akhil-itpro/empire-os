"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { acceptInvite } from "@/app/actions/college";
import { Button } from "@/components/ui/Button";

export function AcceptInvite({ token }: { token: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const accept = async () => {
    setBusy(true);
    setMessage(null);
    const result = await acceptInvite(token);
    if (result.ok) {
      router.push("/college");
      return;
    }
    setBusy(false);
    setMessage(result.message);
  };

  return (
    <div>
      <Button onClick={accept} disabled={busy}>
        {busy ? "Opening College HQ" : "Accept and open College HQ"}
      </Button>
      {message ? (
        <p role="alert" className="mt-3 text-sm text-bone">
          {message}
        </p>
      ) : null}
    </div>
  );
}

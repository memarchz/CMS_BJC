"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Auth, type Session } from "./auth";

export function useRequireAuth(roles: string[]): Session | null {
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    const s = Auth.session();
    if (!s) {
      router.push(`/login?role=${roles[0] || "supplier"}`);
      return;
    }
    if (!roles.includes(s.role)) {
      router.push(Auth.home(s.role));
      return;
    }
    // Session lives in browser storage, so it can only be read after mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSession(s);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return session;
}

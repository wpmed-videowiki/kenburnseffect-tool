"use client";

import { SessionProvider } from "next-auth/react";
import { Suspense } from "react";

export default function NextAuthProvider({ children }) {
  return (
    <SessionProvider>
      <Suspense fallback="loading">{children}</Suspense>
    </SessionProvider>
  );
}

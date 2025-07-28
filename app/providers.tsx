"use client";

import { ThemeProvider } from "@/components/theme-provider";
import { TRPCReactProvider } from "@/trpc/client";
import { ZeroProvider } from "@rocicorp/zero/react";
import { Zero } from "@rocicorp/zero";
import { schema } from "@/lib/schema";
import { createClient } from "@/supabase/client/client";
import type { ReactNode } from "react";

type ProviderProps = {
  children: ReactNode;
};

const userID = "anon";

const supabase = createClient();

const z = new Zero({
  userID,
  auth: async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    return session?.access_token;
  },
  server: process.env.NEXT_PUBLIC_ZERO_SERVER || "http://localhost:4848",
  schema,
  kvStore: "mem",
});

export function Providers({ children }: ProviderProps) {
  return (
    <TRPCReactProvider>
      <ZeroProvider zero={z}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </ZeroProvider>
    </TRPCReactProvider>
  );
}

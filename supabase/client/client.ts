import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "../types";

export const createClient = () => {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    /**
     * TODO: Make use of read replicas when Supabase is upgraded to the pro plan
     * @see https://supabase.com/docs/guides/platform/read-replicas#experimental-routing
     */
    // {
    //   global: {
    //     headers: {
    //       "sb-lb-routing-mode": "alpha-all-services",
    //     },
    //   },
    // },
  );
};
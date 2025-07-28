import { Zero } from "@rocicorp/zero";
import { schema, type Schema } from "./schema";

export function createZeroClient(userID: string, authToken?: string) {
  return new Zero({
    userID,
    auth: authToken,
    server: process.env.NEXT_PUBLIC_ZERO_SERVER || "http://localhost:4848",
    schema,
  });
}

export type ZeroClient = Zero<Schema>;

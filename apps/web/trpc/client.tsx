"use client";

import type { QueryClient } from "@tanstack/react-query";
import { isServer, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { createTRPCClient, httpBatchLink, loggerLink } from "@trpc/client";
import { createTRPCContext } from "@trpc/tanstack-react-query";
import { useState } from "react";
import superjson from "superjson";
import { makeQueryClient } from "./query-client";
import type { AppRouter } from "./routers/_app";

export const { TRPCProvider, useTRPC } = createTRPCContext<AppRouter>();

let browserQueryClient: QueryClient | undefined;

function getQueryClient() {
	if (isServer) {
		return makeQueryClient();
	}
	if (!browserQueryClient) browserQueryClient = makeQueryClient();
	return browserQueryClient;
}

// Your getUrl function (you had it commented out, but the docs have one)
// function getUrl() {
//   const base = (() => {
//     if (typeof window !== 'undefined') return '';
//     if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
//     return 'http://localhost:3000'; // Default for local dev
//   })();
//   return `${base}/api/trpc`;
// }

export function TRPCReactProvider(
	props: Readonly<{
		children: React.ReactNode;
	}>,
) {
	const queryClient = getQueryClient();
	const [trpcClient] = useState(() =>
		createTRPCClient<AppRouter>({
			links: [
				loggerLink({
					enabled: (opts) =>
						process.env.NODE_ENV === "development" ||
						(opts.direction === "down" && opts.result instanceof Error),
				}),
				httpBatchLink({
					url: `http://localhost:3000/api/trpc`,
					transformer: superjson,
				}),
			],
		}),
	);

	return (
		<QueryClientProvider client={queryClient}>
			<TRPCProvider trpcClient={trpcClient} queryClient={queryClient}>
				{props.children}
			</TRPCProvider>
			<ReactQueryDevtools initialIsOpen={false} />
		</QueryClientProvider>
	);
}

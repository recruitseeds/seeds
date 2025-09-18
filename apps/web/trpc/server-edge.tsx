import 'server-only'

import { createCallerFactory, createTRPCContext as createContext } from './init'
import { appRouter } from './routers/_app'

const callerFactory = createCallerFactory(appRouter)

export async function getServerTRPCCaller() {
  const context = await createContext()
  return callerFactory(context)
}
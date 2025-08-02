import { createOpenAPIApp } from '../../../lib/openapi.js'
import { publicCandidatesRoutes } from './candidates.js'
import { publicNotificationsRoutes } from './notifications.js'

const publicRoutes = createOpenAPIApp()

publicRoutes.route('/candidates', publicCandidatesRoutes)
publicRoutes.route('/notifications', publicNotificationsRoutes)

export { publicRoutes }
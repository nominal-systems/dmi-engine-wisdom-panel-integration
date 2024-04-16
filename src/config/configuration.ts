import { Configuration } from './configuration.interface'
import * as process from 'node:process'

export default (): Configuration => ({
  debug: {
    http: process.env.DEBUG_HTTP === 'true',
    api: process.env.DEBUG_API === 'true',
    wisdomApiRequests: process.env.DEBUG_WISDOM_API_REQUESTS === 'true'
  },
  processors: {
    orders: {
      dryRun: process.env.ORDERS_PROCESSOR_DRY_RUN === 'true'
    },
    results: {
      dryRun: process.env.RESULTS_PROCESSOR_DRY_RUN === 'true'
    }
  }
})

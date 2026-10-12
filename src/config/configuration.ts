import { Configuration } from './configuration.interface'
import * as process from 'node:process'

const DEFAULT_STUCK_KIT_HOURS = 36

// An empty or mistyped value must not become 0 or NaN: either would flag every pending kit as stuck.
function positiveNumberOrDefault(value: string | undefined, defaultValue: number): number {
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : defaultValue
}

export default (): Configuration => ({
  debug: {
    http: process.env.DEBUG_HTTP === 'true',
    api: process.env.DEBUG_API === 'true',
    wisdomApiResults: process.env.DEBUG_WISDOM_API_RESULTS === 'true',
  },
  processors: {
    orders: {
      dryRun: process.env.ORDERS_PROCESSOR_DRY_RUN === 'true',
    },
    results: {
      dryRun: process.env.RESULTS_PROCESSOR_DRY_RUN === 'true',
      stuckKitHours: positiveNumberOrDefault(
        process.env.WISDOM_PANEL_STUCK_KIT_HOURS,
        DEFAULT_STUCK_KIT_HOURS,
      ),
    },
  },
})

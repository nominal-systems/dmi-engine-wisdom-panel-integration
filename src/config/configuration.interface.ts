export interface Configuration {
  debug: {
    http: boolean
    api: boolean
  },
  processors: {
    orders: {
      dryRun: boolean
    },
    results: {
      dryRun: boolean
    }
  }
}

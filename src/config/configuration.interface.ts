export interface Configuration {
  debug: {
    http: boolean
    api: boolean
    wisdomApiRequests: boolean
  }
  processors: {
    orders: {
      dryRun: boolean
    }
    results: {
      dryRun: boolean
    }
  }
}

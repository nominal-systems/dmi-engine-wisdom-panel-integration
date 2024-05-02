export interface Configuration {
  debug: {
    http: boolean
    api: boolean
    wisdomApiResults: boolean
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

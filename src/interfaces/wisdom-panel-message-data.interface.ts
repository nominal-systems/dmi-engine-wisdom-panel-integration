import { IMetadata } from '@nominal-systems/dmi-engine-common'

export interface WisdomPanelMessageData<Payload = any> extends IMetadata {
  providerConfiguration: WisdomPanelProviderConfiguration
  integrationOptions: WisdomPanelIntegrationOptions
  payload?: Payload
}

export interface WisdomPanelProviderConfiguration {
  username: string
  password: string
  organizationUnitId: string
}

export interface WisdomPanelIntegrationOptions {
  hospitalName: string
  hospitalNumber: string
  hospitalPhone: string
}

import {
  WisdomPanelClient,
  WisdomPanelHospital,
  WisdomPanelPet,
  WisdomPanelVeterinarian
} from './wisdom-panel-entities.interface'

export interface WisdomPanelApiConfig {
  baseUrl: string
  username: string
  password: string
}

export interface WisdomPanelCreatePetPayload {
  data: {
    organization_unit_id: string
    code: string
  } & Omit<WisdomPanelPet, 'id'>
    & WisdomPanelClient
    & WisdomPanelHospital
    & WisdomPanelVeterinarian
}

export interface WisdomPanelKitQuery extends WisdomPanelKitFiler, WisdomPanelInclude {}

export interface WisdomPanelKitFiler {
  unacknowledged?: boolean
  hospital_number?: string
}

export interface WisdomPanelInclude {
  include?: string
}

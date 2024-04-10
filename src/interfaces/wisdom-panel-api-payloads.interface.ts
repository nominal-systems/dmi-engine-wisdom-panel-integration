import {
  WisdomPanelClient,
  WisdomPanelHospital,
  WisdomPanelPet,
  WisdomPanelVeterinarian
} from './wisdom-panel-entities.interface'

export interface WisdomPanelCreatePetPayload {
  data: {
    organization_unit_id: string
    code: string
  } & Omit<WisdomPanelPet, 'id'>
    & WisdomPanelClient
    & WisdomPanelHospital
    & WisdomPanelVeterinarian
}

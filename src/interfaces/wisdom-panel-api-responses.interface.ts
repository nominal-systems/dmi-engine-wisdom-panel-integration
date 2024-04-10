import { WisdomPanelKit, WisdomPanelPet } from './wisdom-panel-entities.interface'

export interface WisdomPanelPetCreatedResponse {
  message: string
  data: {
    pet: WisdomPanelPet,
    kit: WisdomPanelKit,
    requisition_form: string
  }
}

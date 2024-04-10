import { WisdomPanelKit, WisdomPanelPet } from './wisdom-panel-entities.interface'

export interface OAuthTokenResponse {
  access_token: string
  token_type: string
  expires_in: number
  scope: string
  created_at: number
}

export interface WisdomPanelPetCreatedResponse {
  message: string
  data: {
    pet: WisdomPanelPet,
    kit: WisdomPanelKit,
    requisition_form: string
  }
}

export interface WisdomPanelKitsResponse {
  data: WisdomPanelKitItem[]
}

export interface WisdomPanelKitItem {
  id: string,
  type: 'kits',
  links: any[],
  attributes: {
    code: string,
    'organization-identity': string,
  },
  relationships: any
}

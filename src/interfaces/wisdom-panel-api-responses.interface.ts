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
    pet: WisdomPanelPet
    kit: WisdomPanelKit
    requisition_form: string
  }
}

export interface WisdomPanelBaseResponse {
  meta: {
    'record-count': number
  }
}

export interface WisdomPanelKitsResponse extends WisdomPanelBaseResponse {
  data: WisdomPanelKitItem[]
  included: Array<WisdomPanelPetItem | WisdomPanelStatusesItem>
}

export interface WisdomPanelKitItem extends WisdomPanelLinks {
  id: string
  type: 'kits'
  attributes: {
    code: string
    'organization-identity': string
    active: boolean
    enabled: boolean
    activated: boolean
    'current-stage': string
    'created-at': string
    'veterinarian-name': 'Dr. Foo'
    'hospital-name': 'Test Hospital'
    'hospital-number': '123'
    'inbound-tracking-code'?: string
    'outbound-tracking-code'?: string
    'current-failure'?: string
    'stage-updated-at'?: string
    'legacy-url'?: string
    'auto-activated'?: boolean
    'lab-order-number'?: string
    'sample-received-on'?: string
    'report-ready-on'?: string
    'can-upgrade'?: boolean
    'disabled-at'?: string
    'kit-type-name-override'?: string
    'available-upgrades'?: any[]
    'relative-counts'?: any
    'activated-on'?: string
    'acknowledged-at'?: string
    'resend-banfield-claim-email'?: any
    'hospital-street'?: string
    'hospital-city'?: string
    'hospital-state'?: string
    'hospital-country'?: string
    'hospital-postal-code'?: string
    'profiling-result-present'?: boolean
  }
  relationships: WisdomPanelKitItemRelationships
}

export interface WisdomPanelKitItemRelationships {
  pet?: WisdomPanelLinks
  statuses?: WisdomPanelLinks
  'kit-type'?: WisdomPanelLinks
  'applied-kit-upgrades'?: WisdomPanelLinks
  'active-result-set'?: WisdomPanelLinks
  'previous-result-set'?: WisdomPanelLinks
  'vet-calls'?: WisdomPanelLinks
  'kit-issues'?: WisdomPanelLinks
  'result-sets'?: WisdomPanelLinks
  organization?: WisdomPanelLinks
  'filiation-results'?: WisdomPanelLinks
  'profiling-result'?: WisdomPanelLinks
  'parentage-result'?: WisdomPanelLinks
}

export interface WisdomPanelPetItem extends WisdomPanelLinks {
  id: string
  type: 'pets'
  attributes: {
    name: string
    sex: 'male' | 'female'
    species: 'dog' | 'cat'
    intact: boolean
    'organization-identity': string
    'owner-first-name': string
    'owner-last-name': string
    'created-at': string
    nickname?: string
    story?: string
    'birth-year'?: string
    'birth-month'?: string
    'birth-day'?: string
    'location-display'?: string
    'location-types'?: any[]
    'location-latitude'?: string
    'location-longitude'?: string
    'public-location-city'?: string
    'public-location-state'?: string
    'public-location-country'?: string
    'public-location-latitude'?: string
    'public-location-longitude'?: string
    'custom-registry-name'?: string
    'registration-number'?: string
    'assigned-breed-type'?: string
    'assigned-custom-breed-name'?: string
    'country-of-origin'?: string
    'microchip-number'?: string
    'loi-roi'?: string
    'record-info'?: string
    'identification-tattoo'?: string
    'instagram-handle'?: string
    'share-level'?: string
    'share-health'?: boolean
    'share-token'?: string
    'accepts-optional-email'?: boolean
    'report-viewed-by-owner'?: string
    'upgraded-report-viewed-by-owner'?: boolean
    claimable?: boolean
    'viewed-summary-at'?: string
    'viewed-ancestry-at'?: string
    'viewed-traits-at'?: string
    'viewed-health-at'?: string
    'viewed-profile-settings-at'?: string
    'viewed-share-card-at'?: string
    'viewed-share-settings-at'?: string
    'viewed-relatives-at'?: string
    'last-viewed-relatives-at'?: string
    'updated-share-settings-at'?: string
    'shared-card-at'?: string
    'shared-link-at'?: string
    'added-profile-image-at'?: string
    'generated-technical-report-at'?: string
    'closed-prompt-add-pet-photo-at'?: string
    'completed-typeform-onboarding-survey-at'?: string
    'closed-prompt-add-pet-location-at'?: string
    'active-result-set-viewed-at'?: string
    'closed-pet-gallery-tooltip-at'?: string
    'closed-behaviors-modal-at'?: string
    'closed-share-tooltip-at'?: string
    'reported-deceased-at'?: string
    'viewed-health-update-pop-up-at'?: string
    'viewed-bcsys-one-point-one-pop-up-at'?: string
  }
  relationships: WisdomPanelPetItemRelationships
}

export interface WisdomPanelPetItemRelationships {
  owner?: WisdomPanelLinks
  kits?: WisdomPanelLinks
  'profile-photo'?: WisdomPanelLinks
  'pet-photos'?: WisdomPanelLinks
  'pet-gallery-photos'?: WisdomPanelLinks
  registry?: WisdomPanelLinks
  'assigned-purebreed'?: WisdomPanelLinks
  'assigned-crossbreed'?: WisdomPanelLinks
  'assigned-breeds'?: WisdomPanelLinks
  'organization-unit'?: WisdomPanelLinks
}

export interface WisdomPanelResultSetsResponse extends WisdomPanelBaseResponse {
  data: WisdomPanelResultSetItem[]
  included: Array<WisdomPanelKitItem>
}

export interface WisdomPanelResultSetItem extends WisdomPanelLinks {
  id: string
  type: 'result-sets'
  attributes: {
    'genotype-chip-version': string
    'created-at': string
    'acknowledged-at'?: string
  }
  relationships: {
    kit: WisdomPanelLinks
  }
}

export interface WisdomPanelSimpleResultResponse {
  message: string
  data: WisdomPanelSimpleResult
}

export interface WisdomPanelSimpleResult {
  breed_percentages?: WisdomPanelBreedPercentagesResult[]
  ideal_weight_result?: WisdomPanelIdealWeightResult
  notable_and_at_risk_health_test_results: WisdomPanelNotableAndAtRiskHealthTestResult[]
}

export interface WisdomPanelBreedPercentagesResult {
  percentage: number
  breed: {
    internal_name: string
    slug: string
    name: {
      en: string
    }
  }
}

export interface WisdomPanelIdealWeightResult {
  min_size: number
  max_size: number
  pred_size: number
}

export interface WisdomPanelNotableAndAtRiskHealthTestResult {
  copies: number
  resolved_result: string
  ui_description: string
  health_test: {
    slug: string
    disease_name: {
      en: string
    }
  }
}

export type WisdomPanelTestResult =
  | WisdomPanelBreedPercentagesResult[]
  | WisdomPanelIdealWeightResult
  | WisdomPanelNotableAndAtRiskHealthTestResult[]
  | string

export interface WisdomPanelStatusesItem extends WisdomPanelLinks {
  id: string
  type: 'statuses'
  attributes: {
    code: string
    stage: string
    'sample-lifecycle-status': string
    'created-at': string
  }
  relationships: any
}

export interface WisdomPanelLinks {
  links: {
    self: string
    related?: string
  }
  data?: {
    type: 'pets' | 'kits'
    id: string
  }
}

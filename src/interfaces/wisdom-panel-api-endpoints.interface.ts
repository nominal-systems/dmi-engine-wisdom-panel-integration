export enum WisdomPanelApiEndpoints {
  AUTH = '/oauth/token',
  GET_KITS = '/api/v1/kits',
  GET_RESULT_SETS = '/api/v1/result-sets',
  GET_SIMPLIFIED_RESULT_SETS = '/api/voyager/banfield-results-retrieval',
  GET_REPORT_PDF = '/pdf-generator/vet-report',
  CREATE_PET = '/api/voyager/pet',
  ACKNOWLEDGE_KITS = '/api/voyager/acknowledge-kits',
  ACKNOWLEDGE_RESULT_SETS = '/api/voyager/acknowledge-result-sets'
}

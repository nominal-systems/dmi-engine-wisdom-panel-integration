import { WisdomPanelApiInterceptor } from './wisdom-panel-api.interceptor'
import { WisdomPanelApiEndpoints } from '../interfaces/wisdom-panel-api-endpoints.interface'
import { WisdomPanelApiHttpService } from './wisdom-panel-api-http.service'
import { AxiosResponse } from 'axios'

describe('WisdomPanelApiInterceptor.filter', () => {
  let interceptor: WisdomPanelApiInterceptor

  beforeEach(() => {
    interceptor = new WisdomPanelApiInterceptor({} as WisdomPanelApiHttpService, {} as any)
  })

  const buildResponse = (status: number, recordCount = 1): AxiosResponse<any> => {
    return {
      data: { meta: { 'record-count': recordCount } },
      status,
      statusText: '',
      headers: {},
      config: { url: '' },
      request: { method: 'GET', headers: {} },
    } as any
  }

  describe('filter', () => {
    it('returns false for search endpoints with no records', () => {
      const res = buildResponse(200, 0)
      const result = interceptor.filter(WisdomPanelApiEndpoints.GET_KITS, res.data, res)
      expect(result).toBe(false)
    })

    it('returns true for search endpoints with results', () => {
      const res = buildResponse(200, 1)
      const result = interceptor.filter(WisdomPanelApiEndpoints.GET_KITS, res.data, res)
      expect(result).toBe(true)
    })

    it('does not filter failed requests', () => {
      const res = buildResponse(500, 0)
      const result = interceptor.filter(WisdomPanelApiEndpoints.GET_KITS, res.data, res)
      expect(result).toBe(true)
    })
  })
})

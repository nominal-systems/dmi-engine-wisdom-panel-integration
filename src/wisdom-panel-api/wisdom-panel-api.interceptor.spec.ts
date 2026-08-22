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

  describe('extractAccessionIds', () => {
    it('takes the kit code from the request body when a kit is activated', () => {
      const res = {
        config: { method: 'post', data: JSON.stringify({ data: { code: 'VKDZHKS' } }) },
      } as any
      const ids = interceptor.extractAccessionIds(WisdomPanelApiEndpoints.VOYAGER_PET, {}, res)
      expect(ids).toEqual(['VKDZHKS'])
    })

    it('takes the kit code from the response body when an order is retrieved', () => {
      const body = { data: { kit: { code: 'VKDZHKS' }, requisition_form: 'base64 pdf' } }
      const res = { config: { method: 'get' } } as any
      const ids = interceptor.extractAccessionIds(WisdomPanelApiEndpoints.VOYAGER_PET, body, res)
      expect(ids).toEqual(['VKDZHKS'])
    })
  })
})

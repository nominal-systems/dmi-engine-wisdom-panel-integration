import { WisdomPanelApiInterceptor } from './wisdom-panel-api.interceptor'
import { WisdomPanelApiEndpoints } from '../interfaces/wisdom-panel-api-endpoints.interface'
import { WisdomPanelApiHttpService } from './wisdom-panel-api-http.service'
import { AxiosResponse } from 'axios'
import { Logger } from '@nestjs/common'

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

    it('does not filter a 400 from the kits endpoint', () => {
      const res = buildResponse(400, 0)
      const result = interceptor.filter(WisdomPanelApiEndpoints.GET_KITS, res.data, res)
      expect(result).toBe(true)
    })

    it('returns false for a successful token exchange on /oauth/token', () => {
      const res = buildResponse(200)
      const result = interceptor.filter(WisdomPanelApiEndpoints.AUTH, res.data, res)
      expect(result).toBe(false)
    })

    it('returns false for a failed token exchange on /oauth/token (400 invalid_grant)', () => {
      const res = buildResponse(400)
      const result = interceptor.filter(WisdomPanelApiEndpoints.AUTH, res.data, res)
      expect(result).toBe(false)
    })
  })

  describe('raw_data events', () => {
    let emit: jest.Mock
    let onFulfilled: (response: AxiosResponse) => AxiosResponse
    let onRejected: (err: any) => Promise<never>

    beforeEach(() => {
      jest.spyOn(Logger.prototype, 'debug').mockImplementation(() => undefined)
      emit = jest.fn()
      const axiosRef = {
        interceptors: {
          response: {
            use: (fulfilled, rejected) => {
              onFulfilled = fulfilled
              onRejected = rejected
            },
          },
        },
      }
      new WisdomPanelApiInterceptor({ axiosRef } as any, { emit } as any).onModuleInit()
    })

    afterEach(() => {
      jest.restoreAllMocks()
    })

    const buildCall = (
      url: string,
      status: number,
      data: any,
      payload: any,
    ): AxiosResponse<any> => {
      return {
        data,
        status,
        statusText: '',
        headers: {},
        config: { url, method: 'post', data: JSON.stringify(payload) },
        request: { method: 'POST', headers: {} },
      } as any
    }

    const login = { username: 'dummy-user', password: 'dummy-password', grant_type: 'password' }

    it('does not emit a successful token exchange on /oauth/token', () => {
      const res = buildCall(WisdomPanelApiEndpoints.AUTH, 200, { access_token: 'dummy' }, login)
      expect(onFulfilled(res)).toBe(res)
      expect(emit).not.toHaveBeenCalled()
    })

    it('does not emit a failed token exchange on /oauth/token that axios rejects', async () => {
      const res = buildCall(WisdomPanelApiEndpoints.AUTH, 400, { error: 'invalid_grant' }, login)
      const err = { config: res.config, response: res }
      await expect(onRejected(err)).rejects.toBe(err)
      expect(emit).not.toHaveBeenCalled()
    })

    it('still emits a rejected call to another endpoint', async () => {
      const res = buildCall(WisdomPanelApiEndpoints.ACKNOWLEDGE_KITS, 400, { errors: [] }, {})
      const err = { config: res.config, response: res }
      await expect(onRejected(err)).rejects.toBe(err)
      expect(emit).toHaveBeenCalledWith(
        'raw_data',
        expect.objectContaining({ status: 400, url: WisdomPanelApiEndpoints.ACKNOWLEDGE_KITS }),
      )
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

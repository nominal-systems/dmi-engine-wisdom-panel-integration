import { AxiosInterceptor } from '@nominal-systems/dmi-engine-common'
import { AxiosResponse } from 'axios'
import { WisdomPanelApiEndpoints } from '../interfaces/wisdom-panel-api-endpoints.interface'
import { WisdomPanelBaseResponse } from '../interfaces/wisdom-panel-api-responses.interface'
import { PROVIDER_NAME } from '../constants/provider-name'
import { WisdomPanelApiHttpService } from './wisdom-panel-api-http.service'

const EXCLUDED_ENDPOINTS = [WisdomPanelApiEndpoints.AUTH]

const SEARCH_ENDPOINTS = [WisdomPanelApiEndpoints.GET_KITS, WisdomPanelApiEndpoints.GET_RESULT_SETS]

export class WisdomPanelApiInterceptor extends AxiosInterceptor {
  constructor(httpService: WisdomPanelApiHttpService, client) {
    super(httpService, client)
    this.provider = PROVIDER_NAME
  }

  public filter(url: string, body: any, response: AxiosResponse): boolean {
    // Excluded endpoints are checked first, whatever the status: the token exchange carries the
    // clinic's password in its request payload, so a failed login (400 invalid_grant) must not be
    // let through by the failed-request rule below.
    if (this.isExcluded(url)) {
      return false
    }

    // Do not filter out failed requests to any other endpoint
    if (response.status >= 400) {
      return true
    }

    if (SEARCH_ENDPOINTS.some((endpoint) => url.includes(endpoint))) {
      const res = response as AxiosResponse<WisdomPanelBaseResponse>
      if (res.data.meta['record-count'] === 0) {
        return false
      }
    }

    return true
  }

  // The base class consults filter() only for responses axios resolves; a rejected one (any status
  // outside 2xx) goes straight to handleResponse() and is emitted. Excluded endpoints are dropped
  // here as well, so a failed token exchange does not reach the request store either.
  protected handleResponse(url: string, body: any, response: AxiosResponse): any {
    if (this.isExcluded(url)) {
      return
    }
    return super.handleResponse(url, body, response)
  }

  public debug(url: string, body: any, response: AxiosResponse): boolean {
    return true
  }

  public extractAccessionIds(url: string, body: any, response: AxiosResponse): string[] {
    const accessionIds: string[] = []

    if (url.includes(WisdomPanelApiEndpoints.VOYAGER_PET)) {
      // POST carries the kit code in the request body, GET in the response body
      if (response.config.method?.toLowerCase() === 'get') {
        if (body?.data?.kit?.code !== undefined) {
          accessionIds.push(body.data.kit.code)
        }
      } else {
        const payload: any = JSON.parse(response.config.data)
        if (payload.data.code !== undefined) {
          accessionIds.push(payload.data.code)
        }
      }
    } else if (url.includes(WisdomPanelApiEndpoints.GET_KITS)) {
      body.data.forEach((kit: any) => {
        accessionIds.push(kit.attributes.code)
      })
    } else if (url.includes(WisdomPanelApiEndpoints.GET_RESULT_SETS)) {
      body.included.forEach((kit: any) => {
        accessionIds.push(kit.attributes.code)
      })
    } else if (url.includes(WisdomPanelApiEndpoints.GET_SIMPLIFIED_RESULT_SETS)) {
      // TODO(gb): there is no link to the kit code. Can the kit be included?
    }

    return accessionIds
  }

  private isExcluded(url: string): boolean {
    return EXCLUDED_ENDPOINTS.some((endpoint) => url.includes(endpoint))
  }
}

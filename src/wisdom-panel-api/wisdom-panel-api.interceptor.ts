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
    if (EXCLUDED_ENDPOINTS.some((endpoint) => url.includes(endpoint))) {
      return false
    }

    if (SEARCH_ENDPOINTS.some((endpoint) => url.includes(endpoint))) {
      const res = response as AxiosResponse<WisdomPanelBaseResponse>
      if (res.data.meta['record-count'] === 0) {
        return false
      }
    }

    return true
  }

  public debug(url: string, body: any, response: AxiosResponse): boolean {
    return true
  }
}

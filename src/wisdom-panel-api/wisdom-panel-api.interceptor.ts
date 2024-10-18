import { AxiosInterceptor, ProviderRawData } from '@nominal-systems/dmi-engine-common'
import { AxiosResponse } from 'axios'
import { WisdomPanelApiEndpoints } from '../interfaces/wisdom-panel-api-endpoints.interface'
import { WisdomPanelBaseResponse } from '../interfaces/wisdom-panel-api-responses.interface'
import { PROVIDER_NAME } from '../constants/provider-name'
import { WisdomPanelApiHttpService } from './wisdom-panel-api-http.service'
import * as process from 'node:process'

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

  public extract(url: string, body: any, response: AxiosResponse): ProviderRawData {
    const data = super.extract(url, body, response)

    // Accession IDs
    const accessionIds: string[] = []
    if (url.includes(WisdomPanelApiEndpoints.CREATE_PET)) {
      const payload: any = JSON.parse(data.payload)
      if (payload.data.code !== undefined) {
        accessionIds.push(payload.data.code)
      }
    } else if (url.includes(WisdomPanelApiEndpoints.GET_KITS)) {
      body.data.forEach((kit: any) => {
        accessionIds.push(kit.attributes.code)
      })
    } else if (url.includes(WisdomPanelApiEndpoints.GET_RESULT_SETS)) {
      // TODO(gb): extract accession Ids from get result sets
      console.log(`${url} => ${JSON.stringify(data.body, null, 2)}`) // TODO(gb): remove trace
      process.exit(1)  // TODO(gb): remove
    } else if (url.includes(WisdomPanelApiEndpoints.GET_SIMPLIFIED_RESULT_SETS)) {
      // TODO(gb): extract accession Ids from get simplified result sets
      console.log(`${url} => ${JSON.stringify(data.body, null, 2)}`) // TODO(gb): remove trace
      process.exit(1)  // TODO(gb): remove
    } else if (url.includes(WisdomPanelApiEndpoints.GET_REPORT_PDF)) {
      // TODO(gb): extract accession Ids from get report pdf
      console.log(`url= ${JSON.stringify(url, null, 2)}`) // TODO(gb): remove trace
      process.exit(1)  // TODO(gb): remove
    } else if (url.includes(WisdomPanelApiEndpoints.ACKNOWLEDGE_KITS)) {
      // TODO(gb): extract accession Ids from acknowledge kits
      const payload: any = JSON.parse(data.payload)
      console.log(`${url}= ${JSON.stringify(payload, null, 2)}`) // TODO(gb): remove trace
      process.exit(1)  // TODO(gb): remove
    } else if (url.includes(WisdomPanelApiEndpoints.ACKNOWLEDGE_RESULT_SETS)) {
      const payload: any = JSON.parse(data.payload)
      console.log(`${url}= ${JSON.stringify(payload, null, 2)}`) // TODO(gb): remove trace
      process.exit(1)  // TODO(gb): remove
    }
    if (accessionIds.length > 0) {
      data.accessionIds = accessionIds
    }

    return data
  }
}

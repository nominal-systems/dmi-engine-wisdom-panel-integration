import { Injectable, Logger } from '@nestjs/common'
import { HttpService } from '@nestjs/axios'
import { BaseApiService } from '@nominal-systems/dmi-engine-common'
import {
  WisdomPanelApiConfig,
  WisdomPanelCreatePetPayload,
  WisdomPanelInclude,
  WisdomPanelKitFiler
} from '../interfaces/wisdom-panel-api-payloads.interface'
import {
  OAuthTokenResponse,
  WisdomPanelKitItem,
  WisdomPanelKitsResponse,
  WisdomPanelPetCreatedResponse
} from '../interfaces/wisdom-panel-api-responses.interface'
import { WisdomPanelApiEndpoints } from '../interfaces/wisdom-panel-api-endpoints.interface'

@Injectable()
export class WisdomPanelApiService extends BaseApiService {
  private readonly logger: Logger = new Logger(WisdomPanelApiService.name)

  constructor (private readonly httpService: HttpService) {
    super(httpService)
  }

  private async authenticate (config: WisdomPanelApiConfig): Promise<string> {
    try {
      const payload = {
        username: config.username,
        password: config.password,
        grant_type: 'password',
        scope: 'organization'
      }
      const response = await this.post<OAuthTokenResponse>(`${config.baseUrl}${WisdomPanelApiEndpoints.AUTH}`, payload, {})
      return response.access_token
    } catch (error) {
      throw new Error(`[HTTP ${error.status}] ${error.message}`)
    }
  }

  async getKits (filter: WisdomPanelKitFiler = {}, include: WisdomPanelInclude = {}, config: WisdomPanelApiConfig): Promise<WisdomPanelKitsResponse> {
    try {
      const token = await this.authenticate(config)
      const query = {
        ...include
      }
      for (const key of Object.keys(filter)) {
        query[`filter[${key}]`] = filter[key]
      }
      const reqConfig = {
        params: query,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      }
      return await this.get<WisdomPanelKitsResponse>(`${config.baseUrl}${WisdomPanelApiEndpoints.GET_KITS}`, reqConfig)
    } catch (error) {
      throw new Error(`[HTTP ${error.status}] ${error.message}`)
    }
  }

  async getUnacknowledgedKitsForHospital (hospitalNumber: string, config: WisdomPanelApiConfig): Promise<WisdomPanelKitsResponse> {
    return await this.getKits({
      hospital_number: hospitalNumber,
      unacknowledged: true
    }, { include: 'pet,pet.owner' }, config)
  }

  async getAvailableKits (config: WisdomPanelApiConfig): Promise<WisdomPanelKitItem[]> {
    const response = await this.getKits({}, {}, config)
    return response.data
  }

  async createPet (payload: WisdomPanelCreatePetPayload, config: WisdomPanelApiConfig): Promise<WisdomPanelPetCreatedResponse> {
    try {
      const token = await this.authenticate(config)
      const reqConfig = {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      }
      return await this.post(`${config.baseUrl}${WisdomPanelApiEndpoints.CREATE_PET}`, payload, reqConfig)
    } catch (error) {
      // TODO(gb): handle HTTP 422
      // {
      //     "message": "WIS_VOY__104: Cannot process kit VSMQCZR because it already has a pet."
      // }
      throw new Error(`[HTTP ${error.status}] ${error.message}`)
    }
  }
}

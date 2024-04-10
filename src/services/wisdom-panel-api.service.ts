import { Injectable, Logger } from '@nestjs/common'
import { HttpService } from '@nestjs/axios'
import { BaseApiService } from '@nominal-systems/dmi-engine-common'
import { WisdomPanelApiConfig, WisdomPanelCreatePetPayload } from '../interfaces/wisdom-panel-api-payloads.interface'
import { OAuthTokenResponse, WisdomPanelPetCreatedResponse } from '../interfaces/wisdom-panel-api-responses.interface'
import { WisdomPanelApiEndpoints } from '../interfaces/wisdom-panel-api-endpoints.interface'

@Injectable()
export class WisdomPanelApiService extends BaseApiService {
  private readonly logger: Logger = new Logger(WisdomPanelApiService.name)

  constructor (private readonly httpService: HttpService) {
    super(httpService)
  }

  async authenticate (config: WisdomPanelApiConfig): Promise<string> {
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

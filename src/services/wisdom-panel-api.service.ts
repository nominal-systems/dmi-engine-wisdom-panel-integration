import { Injectable } from '@nestjs/common'
import { HttpService } from '@nestjs/axios'
import { BaseApiService } from '@nominal-systems/dmi-engine-common'
import { WisdomPanelCreatePetPayload } from '../interfaces/wisdom-panel-api-payloads.interface'
import { WisdomPanelProviderConfiguration } from '../interfaces/wisdom-panel-message-data.interface'
import { WisdomPanelPetCreatedResponse } from '../interfaces/wisdom-panel-api-responses.interface'

@Injectable()
export class WisdomPanelApiService extends BaseApiService {
  constructor (private readonly httpService: HttpService) {
    super(httpService)
  }

  async createPet (payload: WisdomPanelCreatePetPayload, config: WisdomPanelProviderConfiguration): Promise<WisdomPanelPetCreatedResponse> {
    try {
      // TODO(gb): POST /api/voyager/pets
      return {} as unknown as WisdomPanelPetCreatedResponse
    } catch (error) {
      // TODO(gb): handle HTTP 422
      // {
      //     "message": "WIS_VOY__104: Cannot process kit VSMQCZR because it already has a pet."
      // }
      throw new Error('Failed to create pet')
    }
  }
}

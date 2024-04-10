import { Controller } from '@nestjs/common'
import { PROVIDER_NAME } from '../constants/provider-name'
import {
  ApiEvent,
  Operation,
  OrderCreatedResponse,
  ProviderOrderCreation,
  Resource
} from '@nominal-systems/dmi-engine-common'
import { WisdomPanelService } from '../services/wisdom-panel.service'
import { WisdomPanelMessageData } from '../interfaces/wisdom-panel-message-data.interface'
import { MessagePattern } from '@nestjs/microservices'

@Controller(`engine/${PROVIDER_NAME}`)
export class WisdomPanelController implements ProviderOrderCreation {
  constructor (
    private readonly wisdomPanelService: WisdomPanelService
  ) {}

  @MessagePattern(`${PROVIDER_NAME}/${Resource.Orders}/${Operation.Create}`)
  public async createOrder (msg: ApiEvent<WisdomPanelMessageData>): Promise<OrderCreatedResponse> {
    const { payload, ...metadata } = msg.data
    return await this.wisdomPanelService.createOrder(payload, metadata)
  }


}

import { Process, Processor } from '@nestjs/bull'
import { PROVIDER_NAME } from '../constants/provider-name'
import { Inject, Logger } from '@nestjs/common'
import { WisdomPanelService } from '../services/wisdom-panel.service'
import { ClientProxy } from '@nestjs/microservices'
import { WisdomPanelMessageData } from '../interfaces/wisdom-panel-message-data.interface'
import { Job } from 'bull'
import { Order } from '@nominal-systems/dmi-engine-common'

@Processor(`${PROVIDER_NAME}.orders`)
export class OrdersProcessor {
  private readonly logger = new Logger(OrdersProcessor.name)

  constructor (
    private readonly wisdomPanelService: WisdomPanelService,
    @Inject('API_SERVICE') private readonly apiClient: ClientProxy
  ) {}

  @Process()
  async fetchOrders (job: Job<WisdomPanelMessageData>) {
    const { payload, ...metadata } = job.data
    const orders: Order[] = await this.wisdomPanelService.getBatchOrders(payload, metadata)

    if (orders.length > 0) {
      this.logger.log(`Fetched ${orders.length} order${orders.length > 1 ? 's' : ''} for integration ${payload.integrationId}`)

      // TODO(gb): notify API
      // this.apiClient.emit('external_orders', {
      //   integrationId: payload.integrationId,
      //   orders
      // })

      // TODO(gb): this could be done in batch
      for (const order of orders) {
        await this.wisdomPanelService.acknowledgeOrder({ id: order.externalId }, metadata)
      }
    }
  }
}

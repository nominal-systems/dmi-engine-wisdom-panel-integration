import { OnQueueError, OnQueueFailed, OnQueueStalled, Process, Processor } from '@nestjs/bull'
import { PROVIDER_NAME } from '../constants/provider-name'
import { Inject, Logger } from '@nestjs/common'
import { WisdomPanelService } from '../services/wisdom-panel.service'
import { ClientProxy } from '@nestjs/microservices'
import { WisdomPanelMessageData } from '../interfaces/wisdom-panel-message-data.interface'
import { Job } from 'bull'
import { Order } from '@nominal-systems/dmi-engine-common'
import { ConfigService } from '@nestjs/config'
import { debugApiEvent } from '../common/debug-utils'

@Processor(`${PROVIDER_NAME}.orders`)
export class OrdersProcessor {
  private readonly logger = new Logger(OrdersProcessor.name)

  constructor(
    private readonly configService: ConfigService,
    private readonly wisdomPanelService: WisdomPanelService,
    @Inject('API_SERVICE') private readonly apiClient: ClientProxy,
  ) {}

  @OnQueueStalled()
  onStalled(job: Job<WisdomPanelMessageData>) {
    this.logger.warn(
      `Job ${job.id} stalled for integration ${job.data.payload?.integrationId}. Attempting retry...`,
    )
  }

  @OnQueueFailed()
  onFailed(job: Job<WisdomPanelMessageData>, error: Error) {
    this.logger.error(
      `Job ${job.id} failed for integration ${job.data.payload?.integrationId}: ${error.message}`,
      error.stack,
    )
  }

  @OnQueueError()
  onError(error: Error) {
    this.logger.error(`Queue error: ${error.message}`, error.stack)
  }

  @Process()
  async fetchOrders(job: Job<WisdomPanelMessageData>) {
    const { payload, ...metadata } = job.data

    try {
      const orders: Order[] = await this.wisdomPanelService.getBatchOrders(payload, metadata)

      if (orders.length > 0) {
        this.logger.log(
          `Fetched ${orders.length} order${orders.length > 1 ? 's' : ''} for integration ${payload.integrationId}`,
        )

        const data = {
          integrationId: payload.integrationId,
          orders,
        }
        this.apiClient.emit('external_orders', data)

        if (this.configService.get('debug.api')) {
          debugApiEvent('external_orders', data)
        }

        // TODO(gb): this could be done in batch
        for (const order of orders) {
          if (!this.configService.get('processors.orders.dryRun')) {
            await this.wisdomPanelService.acknowledgeOrder({ id: order.externalId }, metadata)
          }
        }
      }
    } catch (error) {
      this.logger.error(
        `Error fetching orders for integration ${payload.integrationId}: ${error.message}`,
        error.stack,
      )
      throw error
    }
  }
}

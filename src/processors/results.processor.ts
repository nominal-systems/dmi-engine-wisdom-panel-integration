import { Process, Processor } from '@nestjs/bull'
import { PROVIDER_NAME } from '../constants/provider-name'
import { Inject, Logger } from '@nestjs/common'
import { WisdomPanelService } from '../services/wisdom-panel.service'
import { ClientProxy } from '@nestjs/microservices'
import { WisdomPanelMessageData } from '../interfaces/wisdom-panel-message-data.interface'
import { Job } from 'bull'

@Processor(`${PROVIDER_NAME}.results`)
export class ResultsProcessor {
  private readonly logger = new Logger(ResultsProcessor.name)

  constructor (
    private readonly wisdomPanelService: WisdomPanelService,
    @Inject('API_SERVICE') private readonly apiClient: ClientProxy
  ) {}

  @Process()
  async fetchResults (job: Job<WisdomPanelMessageData>) {
    const { payload, ...metadata } = job.data

    try {
      const batchResults = await this.wisdomPanelService.getBatchResults(payload, metadata)

      if (batchResults.results.length > 0) {
        this.logger.log(`Fetched ${batchResults.results.length} result${batchResults.results.length > 1 ? 's' : ''} for integration ${payload.integrationId}`)

        // TODO(gb): notify API
        // this.apiClient.emit('external_order_results', {
        //   integrationId: payload.integrationId,
        //   results: batchResults.results
        // })
        // this.apiClient.emit('external_results', {
        //   integrationId: payload.integrationId,
        //   results: batchResults.results
        // })

        // TODO(gb): acknowledge results
      }
    } catch (error) {
      this.logger.error(`Error fetching results for integration ${payload.integrationId}: ${error.message}`)
    }
  }
}

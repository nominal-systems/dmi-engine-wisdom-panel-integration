import { Injectable, Logger } from '@nestjs/common'
import {
  BaseProviderService,
  BatchResultsResponse,
  Breed,
  calculateHash,
  CreateOrderPayload,
  Device,
  FileUtils,
  IdPayload,
  IntegrationTestResponse,
  NullPayloadPayload,
  Order,
  OrderCreatedResponse,
  OrderStatus,
  OrderTestPayload,
  ReferenceDataResponse,
  Result,
  Service,
  ServiceCodePayload,
  Sex,
  Species
} from '@nominal-systems/dmi-engine-common'
import { WisdomPanelMessageData } from '../interfaces/wisdom-panel-message-data.interface'
import { WisdomPanelApiService } from '../wisdom-panel-api/wisdom-panel-api.service'
import { WisdomPanelMapper } from '../providers/wisdom-panel-mapper'
import { WisdomPanelCreatePetPayload } from '../interfaces/wisdom-panel-api-payloads.interface'
import {
  WisdomPanelKitItem,
  WisdomPanelKitsResponse,
  WisdomPanelPetCreatedResponse,
  WisdomPanelPetItem,
  WisdomPanelResultSetsResponse
} from '../interfaces/wisdom-panel-api-responses.interface'
import { ConfigService } from '@nestjs/config'
import { debugOrderCreated } from '../common/debug-utils'
import { WisdomApiException } from '../exceptions/wisdom-api.exception'

@Injectable()
export class WisdomPanelService extends BaseProviderService<WisdomPanelMessageData> {
  private readonly logger: Logger = new Logger(WisdomPanelService.name)

  constructor(
    private readonly configService: ConfigService,
    private readonly wisdomPanelApiService: WisdomPanelApiService,
    private readonly wisdomPanelMapper: WisdomPanelMapper
  ) {
    super()
  }

  async testAuth(payload: NullPayloadPayload, metadata: any): Promise<IntegrationTestResponse> {
    try {
      await this.wisdomPanelApiService.testAuth(metadata.providerConfiguration)
      return {
        success: true,
        message: 'Successfully authenticated with Wisdom Panel API'
      }
    } catch (error) {
      return {
        success: false,
        message: error.message
      }
    }
  }


  async createOrder(payload: CreateOrderPayload, metadata: WisdomPanelMessageData): Promise<OrderCreatedResponse> {
    try {
      const createPetPayload: WisdomPanelCreatePetPayload = this.wisdomPanelMapper.mapCreateOrderPayload(
        payload,
        metadata
      )
      const response: WisdomPanelPetCreatedResponse = await this.wisdomPanelApiService.createPet(
        createPetPayload,
        metadata.providerConfiguration
      )

      if (this.configService.get('debug.api')) {
        debugOrderCreated(payload, response)
      }

      return {
        externalId: response.data.kit.id,
        requisitionId: response.data.kit.code,
        status: OrderStatus.SUBMITTED,
        manifest: {
          contentType: 'application/pdf',
          data: response.data.requisition_form
        }
      }
    } catch (err) {
      throw new WisdomApiException('Failed to create order', err.status, err)
    }
  }

  async getBatchOrders(payload: NullPayloadPayload, metadata: WisdomPanelMessageData): Promise<Order[]> {
    const orders: Order[] = []
    try {
      const response: WisdomPanelKitsResponse = await this.wisdomPanelApiService.getUnacknowledgedKitsForHospital(
        metadata.integrationOptions.hospitalNumber,
        metadata.providerConfiguration
      )
      this.logger.debug(
        `Found ${response.data.length} kit${response.data.length === 1 ? '' : 's'} for hospital '${metadata.integrationOptions.hospitalNumber}'`
      )
      for (const kit of response.data) {
        const pet = response.included.find((include): include is WisdomPanelPetItem => {
          return include.type === 'pets' && include.id === kit.relationships?.pet?.data?.id
        })

        if (pet === undefined) {
          this.logger.warn(`Pet not found for kit ${kit.id}`)
          continue
        }

        const order: Order = this.wisdomPanelMapper.mapWisdomPanelKit(kit, pet)
        orders.push(order)
        this.logger.debug(`Found kit ${order.externalId} (kit code: ${kit.attributes.code})`)
      }
    } catch (err) {
      throw new WisdomApiException('Failed to get batch orders', err.status, err)
    }

    return orders
  }

  async getBatchResults(payload: NullPayloadPayload, metadata: WisdomPanelMessageData): Promise<BatchResultsResponse> {
    const batchResults: BatchResultsResponse = {
      results: []
    }

    try {
      const response: WisdomPanelResultSetsResponse =
        await this.wisdomPanelApiService.getUnacknowledgedResultSetsForHospital(
          metadata.integrationOptions.hospitalNumber,
          metadata.providerConfiguration
        )
      this.logger.debug(
        `Found ${response.data.length} result set${response.data.length === 1 ? '' : 's'} for hospital '${metadata.integrationOptions.hospitalNumber}'`
      )
      for (const resultSet of response.data) {
        const kitId = resultSet.relationships.kit.data?.id
        const kit = response.included.find((include): include is WisdomPanelKitItem => {
          return include.type === 'kits' && include.id === kitId
        })
        if (kit === undefined) {
          this.logger.warn(`Kit not found for result set ${resultSet.id}`)
          continue
        }

        // Get simplified results
        this.logger.debug(`Found result set ${resultSet.id} (kit code: ${kit.attributes.code})`)
        const simplifiedResults = await this.wisdomPanelApiService.getSimplifiedResultSets(
          kit.id,
          metadata.providerConfiguration
        )

        // Get PDF report
        const base64PdfReport = await this.wisdomPanelApiService.getReportPdfBase64(
          kit.id,
          metadata.providerConfiguration
        )

        if (this.configService.get('debug.wisdomApiResults')) {
          FileUtils.saveFile(
            `simplified-results-${kit.attributes.code}.json`,
            JSON.stringify(simplifiedResults.data, null, 2)
          )
        }

        batchResults.results.push(
          this.wisdomPanelMapper.mapWisdomPanelResult(resultSet, kit, simplifiedResults.data, base64PdfReport)
        )
      }
    } catch (error) {
      throw new Error(`Failed to get batch results: ${error.message}`)
    }

    return batchResults
  }

  async acknowledgeOrder(payload: IdPayload, metadata: WisdomPanelMessageData): Promise<void> {
    await this.wisdomPanelApiService.acknowledgeKits([payload.id], metadata.providerConfiguration)
  }

  async acknowledgeResult(payload: IdPayload, metadata: WisdomPanelMessageData): Promise<void> {
    await this.wisdomPanelApiService.acknowledgeResultSets([payload.id], metadata.providerConfiguration)
  }

  cancelOrder(payload: IdPayload, metadata: WisdomPanelMessageData): Promise<void> {
    throw new Error('Method not implemented')
  }

  cancelOrderTest(payload: OrderTestPayload, metadata: WisdomPanelMessageData): Promise<void> {
    throw new Error('Method not implemented')
  }

  createRequisitionId(payload: NullPayloadPayload, metadata: WisdomPanelMessageData): string {
    throw new Error('Method not implemented')
  }

  getOrder(payload: IdPayload, metadata: WisdomPanelMessageData): Promise<Order> {
    throw new Error('Method not implemented')
  }

  getOrderResult(payload: IdPayload, metadata: WisdomPanelMessageData): Promise<Result> {
    throw new Error('Method not implemented')
  }

  getServiceByCode(payload: ServiceCodePayload, metadata: WisdomPanelMessageData): Promise<Service> {
    throw new Error('Method not implemented')
  }

  async getServices(payload: NullPayloadPayload, metadata: WisdomPanelMessageData): Promise<Service[]> {
    const kits: WisdomPanelKitItem[] = await this.wisdomPanelApiService.getAvailableKits(metadata.providerConfiguration)
    return kits.map((kit) => ({
      code: kit.attributes.code,
      name: kit.attributes['organization-identity']
    }))
  }

  getSexes(): Promise<ReferenceDataResponse<Sex>> {
    const items: Sex[] = [
      {
        code: 'male',
        name: 'MALE'
      },
      {
        code: 'female',
        name: 'FEMALE'
      }
    ]

    return Promise.resolve({
      items,
      hash: calculateHash(items)
    })
  }

  getDevices(): Promise<Device[]> {
    return Promise.resolve([])
  }

  getSpecies(): Promise<ReferenceDataResponse<Species>> {
    const items: Species[] = [
      {
        code: 'dog',
        name: 'CANINE'
      },
      {
        code: 'cat',
        name: 'FELINE'
      }
    ]

    return Promise.resolve({
      items,
      hash: calculateHash(items)
    })
  }

  getBreeds(): Promise<ReferenceDataResponse<Breed>> {
    return Promise.resolve({
      items: [],
      hash: calculateHash([])
    })
  }
}

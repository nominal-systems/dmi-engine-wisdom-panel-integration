import { Injectable, Logger } from '@nestjs/common'
import {
  BaseProviderService,
  BatchResultsResponse,
  Breed,
  calculateHash,
  CreateOrderPayload,
  Device,
  IdPayload,
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
import { WisdomPanelApiService } from './wisdom-panel-api.service'
import { WisdomPanelMapper } from '../providers/wisdom-panel-mapper'
import { WisdomPanelCreatePetPayload } from '../interfaces/wisdom-panel-api-payloads.interface'
import {
  WisdomPanelKitItem,
  WisdomPanelKitsResponse, WisdomPanelPetItem,
  WisdomPanelResultSetsResponse, WisdomPanelStatusesItem
} from '../interfaces/wisdom-panel-api-responses.interface'

@Injectable()
export class WisdomPanelService extends BaseProviderService<WisdomPanelMessageData> {
  private readonly logger: Logger = new Logger(WisdomPanelService.name)


  constructor (
    private readonly wisdomPanelApiService: WisdomPanelApiService,
    private readonly wisdomPanelMapper: WisdomPanelMapper
  ) {
    super()
  }

  public async createOrder (payload: CreateOrderPayload, metadata: WisdomPanelMessageData): Promise<OrderCreatedResponse> {
    try {
      const createPetPayload: WisdomPanelCreatePetPayload = this.wisdomPanelMapper.mapCreateOrderPayload(payload, metadata)
      const response = await this.wisdomPanelApiService.createPet(createPetPayload, metadata.providerConfiguration)

      return {
        externalId: response.data.kit.id,
        status: OrderStatus.SUBMITTED,
        manifest: {
          data: response.data.requisition_form
        }
      }
    } catch (error) {
      throw new Error(`Failed to create order: ${error.message}`)
    }
  }

  async getBatchOrders (payload: NullPayloadPayload, metadata: WisdomPanelMessageData): Promise<Order[]> {
    const orders: Order[] = []
    try {
      const response: WisdomPanelKitsResponse = await this.wisdomPanelApiService.getUnacknowledgedKitsForHospital(metadata.integrationOptions.hospitalNumber, metadata.providerConfiguration)
      this.logger.debug(`Found ${response.data.length} unacknowledged kit${response.data.length > 1 ? 's' : ''} for hospital '${metadata.integrationOptions.hospitalNumber}'`)
      for (const kit of response.data) {
        const pet = response.included.find((include): include is WisdomPanelPetItem => {
          return include.type === 'pets' && include.id === kit.relationships?.pet?.data?.id
        })

        if (pet === undefined) {
          this.logger.warn(`Pet not found for kit ${kit.id}`)
          continue
        }

        // TODO(gb): do we need the included statuses?
        // const status = response.included.find((include): include is WisdomPanelStatusesItem => {
        //   return include.type === 'statuses' && include.id === kit.relationships?.statuses?.data?.id
        // })

        const order: Order = this.wisdomPanelMapper.mapWisdomPanelKit(kit, pet)
        orders.push(order)
        this.logger.debug(`Found kit ${order.externalId} (kit code: ${kit.attributes.code})`)
      }

    } catch (error) {
      throw new Error(`Failed to get batch orders: ${error.message}`)
    }

    return orders
  }

  async getBatchResults (payload: NullPayloadPayload, metadata: WisdomPanelMessageData): Promise<BatchResultsResponse> {
    const batchResults: BatchResultsResponse = {
      results: []
    }

    try {
      const response: WisdomPanelResultSetsResponse = await this.wisdomPanelApiService.getUnacknowledgedResultSetsForHospital(metadata.integrationOptions.hospitalNumber, metadata.providerConfiguration)
      this.logger.debug(`Found ${response.data.length} unacknowledged result set${response.data.length > 1 ? 's' : ''} for hospital '${metadata.integrationOptions.hospitalNumber}'`)
      for (const resultSet of response.data) {
        const kitId = resultSet.relationships.kit.data?.id
        const kit = response.included
          .find((include) => {
          return include.type === 'kits' && include.id === kitId
        })
        if (kit === undefined) {
          this.logger.warn(`Kit not found for result set ${resultSet.id}`)
          continue
        }

        this.logger.debug(`Found result set ${resultSet.id} (kit code: ${kit.attributes.code})`)
        const simplifiedResults = await this.wisdomPanelApiService.getSimplifiedResultSets(kitId, metadata.providerConfiguration)
        batchResults.results.push(this.wisdomPanelMapper.mapWisdomPanelSimpleResult(simplifiedResults.data))
      }
    } catch (error) {
      throw new Error(`Failed to get batch results: ${error.message}`)
    }

    return batchResults
  }

  public acknowledgeOrder (payload: IdPayload, metadata: WisdomPanelMessageData): Promise<void> {
    throw new Error('Method not implemented')
  }

  public acknowledgeResult (payload: IdPayload, metadata: WisdomPanelMessageData): Promise<void> {
    throw new Error('Method not implemented')
  }

  public cancelOrder (payload: IdPayload, metadata: WisdomPanelMessageData): Promise<void> {
    throw new Error('Method not implemented')
  }

  public cancelOrderTest (payload: OrderTestPayload, metadata: WisdomPanelMessageData): Promise<void> {
    throw new Error('Method not implemented')
  }

  public createRequisitionId (payload: NullPayloadPayload, metadata: WisdomPanelMessageData): string {
    throw new Error('Method not implemented')
  }

  public getOrder (payload: IdPayload, metadata: WisdomPanelMessageData): Promise<Order> {
    throw new Error('Method not implemented')
  }

  public getOrderResult (payload: IdPayload, metadata: WisdomPanelMessageData): Promise<Result> {
    throw new Error('Method not implemented')
  }

  public getServiceByCode (payload: ServiceCodePayload, metadata: WisdomPanelMessageData): Promise<Service> {
    throw new Error('Method not implemented')
  }

  async getServices (payload: NullPayloadPayload, metadata: WisdomPanelMessageData): Promise<Service[]> {
    const kits: WisdomPanelKitItem[] = await this.wisdomPanelApiService.getAvailableKits(metadata.providerConfiguration)
    return kits.map(kit => ({
      code: kit.attributes.code,
      name: kit.attributes['organization-identity']
    }))
  }

  public getSexes (): Promise<ReferenceDataResponse<Sex>> {
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

  public getDevices (): Promise<Device[]> {
    return Promise.resolve([])
  }

  public getSpecies (): Promise<ReferenceDataResponse<Species>> {
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

  public getBreeds (): Promise<ReferenceDataResponse<Breed>> {
    return Promise.resolve({
      items: [],
      hash: calculateHash([])
    })
  }

}

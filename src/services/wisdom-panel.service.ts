import { Injectable, Logger } from '@nestjs/common'
import {
  BaseProviderService,
  BatchResultsResponse,
  Breed, calculateHash,
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
import { WisdomPanelKitItem } from '../interfaces/wisdom-panel-api-responses.interface'

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

  public getBatchOrders (payload: NullPayloadPayload, metadata: WisdomPanelMessageData): Promise<Order[]> {
    throw new Error('Method not implemented')
  }

  public getBatchResults (payload: NullPayloadPayload, metadata: WisdomPanelMessageData): Promise<BatchResultsResponse> {
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

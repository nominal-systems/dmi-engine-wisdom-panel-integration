import { Injectable, Logger } from '@nestjs/common'
import {
  BaseProviderService,
  BatchResultsResponse,
  Breed,
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
      this.logger.error(error)
      throw new Error('Failed to create order')
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

  public getBreeds (payload: NullPayloadPayload, metadata: WisdomPanelMessageData): Promise<ReferenceDataResponse<Breed>> {
    throw new Error('Method not implemented')
  }

  public getDevices (payload: NullPayloadPayload, metadata: WisdomPanelMessageData): Promise<Device[]> {
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

  public getServices (payload: NullPayloadPayload, metadata: WisdomPanelMessageData): Promise<Service[]> {
    throw new Error('Method not implemented')
  }

  public getSexes (payload: NullPayloadPayload, metadata: WisdomPanelMessageData): Promise<ReferenceDataResponse<Sex>> {
    throw new Error('Method not implemented')
  }

  public getSpecies (payload: NullPayloadPayload, metadata: WisdomPanelMessageData): Promise<ReferenceDataResponse<Species>> {
    throw new Error('Method not implemented')
  }


}
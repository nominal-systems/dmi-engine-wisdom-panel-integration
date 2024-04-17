import { Controller } from '@nestjs/common'
import { PROVIDER_NAME } from '../constants/provider-name'
import {
  ApiEvent,
  Breed,
  Device,
  Operation,
  OrderCreatedResponse,
  ProviderOrderCreation,
  ProviderReferenceData,
  ProviderServices,
  ReferenceDataResponse,
  Resource,
  Service,
  Sex,
  Species
} from '@nominal-systems/dmi-engine-common'
import { WisdomPanelService } from '../services/wisdom-panel.service'
import { WisdomPanelMessageData } from '../interfaces/wisdom-panel-message-data.interface'
import { MessagePattern } from '@nestjs/microservices'

@Controller(`engine/${PROVIDER_NAME}`)
export class WisdomPanelController implements ProviderOrderCreation, ProviderReferenceData, ProviderServices {
  constructor(private readonly wisdomPanelService: WisdomPanelService) {}

  @MessagePattern(`${PROVIDER_NAME}/${Resource.Orders}/${Operation.Create}`)
  public async createOrder(msg: ApiEvent<WisdomPanelMessageData>): Promise<OrderCreatedResponse> {
    const { payload, ...metadata } = msg.data
    return await this.wisdomPanelService.createOrder(payload, metadata)
  }

  @MessagePattern(`${PROVIDER_NAME}/${Resource.Sexes}/${Operation.List}`)
  public getSexes(msg: ApiEvent<WisdomPanelMessageData>): Promise<ReferenceDataResponse<Sex> | Sex[]> {
    return this.wisdomPanelService.getSexes()
  }

  @MessagePattern(`${PROVIDER_NAME}/${Resource.Species}/${Operation.List}`)
  public getSpecies(msg: ApiEvent<WisdomPanelMessageData>): Promise<ReferenceDataResponse<Species> | Species[]> {
    return this.wisdomPanelService.getSpecies()
  }

  @MessagePattern(`${PROVIDER_NAME}/${Resource.Breeds}/${Operation.List}`)
  public getBreeds(msg: ApiEvent<WisdomPanelMessageData>): Promise<ReferenceDataResponse<Breed> | Breed[]> {
    return this.wisdomPanelService.getBreeds()
  }

  @MessagePattern(`${PROVIDER_NAME}/${Resource.Services}/${Operation.List}`)
  public getServices(msg: ApiEvent<WisdomPanelMessageData>): Promise<ReferenceDataResponse<Service> | Service[]> {
    const { payload, ...metadata } = msg.data
    return this.wisdomPanelService.getServices(payload, metadata)
  }

  @MessagePattern(`${PROVIDER_NAME}/${Resource.Devices}/${Operation.List}`)
  public getDevices(msg: ApiEvent<WisdomPanelMessageData>): Promise<ReferenceDataResponse<Device> | Device[]> {
    return this.wisdomPanelService.getDevices()
  }
}

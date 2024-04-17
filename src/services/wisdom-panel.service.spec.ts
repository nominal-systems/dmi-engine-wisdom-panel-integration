import { WisdomPanelService } from './wisdom-panel.service'
import { Test, TestingModule } from '@nestjs/testing'
import { WisdomPanelApiService } from './wisdom-panel-api.service'
import { WisdomPanelMapper } from '../providers/wisdom-panel-mapper'
import { CreateOrderPayload, OrderCreatedResponse } from '@nominal-systems/dmi-engine-common'
import { WisdomPanelMessageData } from '../interfaces/wisdom-panel-message-data.interface'
import { ConfigService } from '@nestjs/config'

describe('WisdomPanelService', () => {
  let service: WisdomPanelService
  const mapperMock = {
    mapCreateOrderPayload: jest.fn()
  }
  const apiServiceMock = {
    createPet: jest.fn()
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WisdomPanelService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn()
          }
        },
        {
          provide: WisdomPanelApiService,
          useValue: apiServiceMock
        },
        {
          provide: WisdomPanelMapper,
          useValue: mapperMock
        }
      ]
    }).compile()

    service = module.get<WisdomPanelService>(WisdomPanelService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  describe('createOrder()', () => {
    it('should go through the create pet workflow', async () => {
      const payload = {} as unknown as CreateOrderPayload
      const metadata = {} as unknown as WisdomPanelMessageData
      apiServiceMock.createPet.mockResolvedValue({
        data: {
          pet: {},
          kit: {
            id: 'test-id'
          },
          requisition_form: 'base64 pdf'
        }
      })
      const response: OrderCreatedResponse = await service.createOrder(payload, metadata)
      expect(mapperMock.mapCreateOrderPayload).toHaveBeenCalled()
      expect(apiServiceMock.createPet).toHaveBeenCalled()
      expect(response).toEqual({
        externalId: expect.any(String),
        status: expect.any(String),
        manifest: expect.objectContaining({
          data: expect.any(String)
        })
      })
    })
  })
})

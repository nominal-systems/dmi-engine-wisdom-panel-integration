import { Test, TestingModule } from '@nestjs/testing'
import { ConfigService } from '@nestjs/config'
import { OrdersProcessor } from './orders.processors'
import { WisdomPanelService } from '../services/wisdom-panel.service'

describe('OrdersProcessor', () => {
  let processor: OrdersProcessor

  const configServiceMock = {
    get: jest.fn(),
  }

  const wisdomPanelServiceMock = {
    getBatchOrders: jest.fn(),
    acknowledgeOrder: jest.fn(),
  }

  const apiClientMock = {
    emit: jest.fn(),
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersProcessor,
        {
          provide: ConfigService,
          useValue: configServiceMock,
        },
        {
          provide: WisdomPanelService,
          useValue: wisdomPanelServiceMock,
        },
        {
          provide: 'API_SERVICE',
          useValue: apiClientMock,
        },
      ],
    }).compile()

    processor = module.get<OrdersProcessor>(OrdersProcessor)
    jest.clearAllMocks()
  })

  it('should be defined', () => {
    expect(processor).toBeDefined()
  })

  it('should rethrow when getBatchOrders fails', async () => {
    const error = new Error('orders failed')
    const job = {
      data: {
        payload: {
          integrationId: 'integration-1',
        },
      },
    } as any

    wisdomPanelServiceMock.getBatchOrders.mockRejectedValueOnce(error)

    await expect(processor.fetchOrders(job)).rejects.toThrow(error)
  })
})

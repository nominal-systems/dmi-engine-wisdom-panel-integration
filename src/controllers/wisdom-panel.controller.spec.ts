import { Test, TestingModule } from '@nestjs/testing'
import { PATTERN_METADATA } from '@nestjs/microservices/constants'
import { ApiEvent, sharedSubscriptionTopic } from '@nominal-systems/dmi-engine-common'
import { WisdomPanelController } from './wisdom-panel.controller'
import { WisdomPanelService } from '../services/wisdom-panel.service'
import { WisdomPanelMessageData } from '../interfaces/wisdom-panel-message-data.interface'
import { SHARED_SUBSCRIPTION_GROUP } from '../constants/shared-subscription-group'

describe('WisdomPanelController', () => {
  let controller: WisdomPanelController
  const serviceMock = {
    getManifest: jest.fn(),
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [WisdomPanelController],
      providers: [
        {
          provide: WisdomPanelService,
          useValue: serviceMock,
        },
      ],
    }).compile()

    controller = module.get<WisdomPanelController>(WisdomPanelController)
    jest.clearAllMocks()
  })

  describe('getOrderManifest()', () => {
    it('should subscribe to the shared orders/manifest topic', () => {
      const patterns = Reflect.getMetadata(
        PATTERN_METADATA,
        WisdomPanelController.prototype.getOrderManifest,
      )
      expect(patterns).toContain(
        sharedSubscriptionTopic(SHARED_SUBSCRIPTION_GROUP, 'wisdom-panel/orders/manifest'),
      )
    })

    it('should delegate to the service with the payload and metadata', async () => {
      serviceMock.getManifest.mockRejectedValue(new Error('no manifest'))
      const msg = {
        data: {
          payload: { id: 'kit-id-1' },
          integrationId: 'integration-id',
          providerConfiguration: {},
          integrationOptions: { hospitalNumber: '005437' },
        },
      } as unknown as ApiEvent<WisdomPanelMessageData>

      await expect(controller.getOrderManifest(msg)).rejects.toThrow('no manifest')
      expect(serviceMock.getManifest).toHaveBeenCalledWith(
        { id: 'kit-id-1' },
        expect.objectContaining({ integrationId: 'integration-id' }),
      )
    })
  })
})

import { WisdomPanelService } from './wisdom-panel.service'
import { Test, TestingModule } from '@nestjs/testing'
import { WisdomPanelApiService } from '../wisdom-panel-api/wisdom-panel-api.service'
import { WisdomPanelMapper } from '../providers/wisdom-panel-mapper'
import {
  BatchResultsResponse,
  CreateOrderPayload,
  NullPayloadPayload,
  OrderCreatedResponse,
  OrderStatus,
} from '@nominal-systems/dmi-engine-common'
import { WisdomPanelMessageData } from '../interfaces/wisdom-panel-message-data.interface'
import { ConfigService } from '@nestjs/config'
import { WisdomApiException } from '../exceptions/wisdom-api.exception'
import {
  FEATURE_FLAG_PROVIDER,
  WISDOM_PANEL_ACTIVATED_KIT_RECOVERY,
  type FeatureFlagProvider,
} from '../feature-flags/feature-flag.interface'

describe('WisdomPanelService', () => {
  let service: WisdomPanelService
  let featureFlagProviderMock: jest.Mocked<FeatureFlagProvider>
  const mapperMock = {
    mapCreateOrderPayload: jest.fn(),
    mapWisdomPanelResult: jest.fn(),
  }
  const apiServiceMock = {
    createPet: jest.fn(),
    getKits: jest.fn(),
    getUnacknowledgedKitsForHospital: jest.fn(),
    getUnacknowledgedResultSetsForHospital: jest.fn(),
    getSimplifiedResultSets: jest.fn(),
    getReportPdfBase64: jest.fn(),
    acknowledgeKits: jest.fn(),
    acknowledgeResultSets: jest.fn(),
  }

  beforeEach(async () => {
    featureFlagProviderMock = {
      isEnabled: jest.fn().mockReturnValue(false),
    }
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WisdomPanelService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(),
          },
        },
        {
          provide: WisdomPanelApiService,
          useValue: apiServiceMock,
        },
        {
          provide: WisdomPanelMapper,
          useValue: mapperMock,
        },
        {
          provide: FEATURE_FLAG_PROVIDER,
          useValue: featureFlagProviderMock,
        },
      ],
    }).compile()

    service = module.get<WisdomPanelService>(WisdomPanelService)
    jest.clearAllMocks()
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
            id: 'test-id',
            code: 'AAA',
          },
          requisition_form: 'base64 pdf',
        },
      })
      const response: OrderCreatedResponse = await service.createOrder(payload, metadata)
      expect(mapperMock.mapCreateOrderPayload).toHaveBeenCalled()
      expect(apiServiceMock.createPet).toHaveBeenCalled()
      expect(response).toEqual({
        externalId: 'test-id',
        requisitionId: 'AAA',
        status: expect.any(String),
        manifest: expect.objectContaining({
          data: expect.any(String),
        }),
      })
    })

    it('should propagate the provider status code when order creation fails', async () => {
      const payload = {} as unknown as CreateOrderPayload
      const metadata = {
        integrationOptions: { hospitalNumber: '005437' },
        providerConfiguration: {},
      } as unknown as WisdomPanelMessageData
      mapperMock.mapCreateOrderPayload.mockReturnValue({ data: { code: 'AAA' } })
      apiServiceMock.createPet.mockRejectedValue(
        new WisdomApiException('Failed to create pet', 422, new Error('Unprocessable Entity')),
      )
      await expect(service.createOrder(payload, metadata)).rejects.toMatchObject({
        statusCode: 422,
      })
      expect(apiServiceMock.getKits).not.toHaveBeenCalled()
    })

    it('should wrap order payload mapping failures as provider errors', async () => {
      const payload = {} as unknown as CreateOrderPayload
      const metadata = {} as unknown as WisdomPanelMessageData
      mapperMock.mapCreateOrderPayload.mockImplementation(() => {
        throw new Error('Unexpected mapping failure')
      })
      await expect(service.createOrder(payload, metadata)).rejects.toMatchObject({
        message: 'Failed to create order',
      })
      expect(apiServiceMock.createPet).not.toHaveBeenCalled()
      expect(apiServiceMock.getKits).not.toHaveBeenCalled()
    })

    describe('422 recovery', () => {
      const payload = {} as unknown as CreateOrderPayload
      const metadata = {
        integrationOptions: { hospitalNumber: '005437' },
        providerConfiguration: {},
      } as unknown as WisdomPanelMessageData

      const createPetPayload = {
        data: {
          code: 'VRHPBBN',
          name: 'Firulais',
          species: 'dog',
          client_last_name: 'Greco',
        },
      }

      const unprocessable = new WisdomApiException(
        'Failed to create pet',
        422,
        new Error('Unprocessable Entity'),
      )

      const buildKitsResponse = (
        kitAttributes: Record<string, unknown>,
        petAttributes?: Record<string, unknown>,
      ) => ({
        data: [
          {
            id: 'kit-id-1',
            type: 'kits',
            attributes: kitAttributes,
            relationships: { pet: { data: { type: 'pets', id: 'pet-id-1' } } },
          },
        ],
        included:
          petAttributes !== undefined
            ? [{ id: 'pet-id-1', type: 'pets', attributes: petAttributes }]
            : [],
      })

      beforeEach(() => {
        mapperMock.mapCreateOrderPayload.mockReturnValue(createPetPayload)
        apiServiceMock.createPet.mockRejectedValue(unprocessable)
        featureFlagProviderMock.isEnabled.mockReturnValue(true)
      })

      it('should recover the order when the kit is activated for the same pet', async () => {
        apiServiceMock.getKits.mockResolvedValue(
          buildKitsResponse(
            { code: 'VRHPBBN', activated: true },
            { name: '  firulais ', species: 'dog', 'owner-last-name': 'Greco' },
          ),
        )
        const response: OrderCreatedResponse = await service.createOrder(payload, metadata)
        expect(featureFlagProviderMock.isEnabled).toHaveBeenCalledWith(
          WISDOM_PANEL_ACTIVATED_KIT_RECOVERY,
          expect.objectContaining({ clinicId: '005437' }),
        )
        expect(apiServiceMock.getKits).toHaveBeenCalledWith(
          { code: 'VRHPBBN', hospital_number: '005437' },
          { include: 'pet,pet.owner' },
          expect.any(Object),
        )
        expect(response).toEqual({
          externalId: 'kit-id-1',
          requisitionId: 'VRHPBBN',
          status: OrderStatus.SUBMITTED,
          manifest: null,
        })
      })

      it('should not attempt recovery when the flag is disabled', async () => {
        featureFlagProviderMock.isEnabled.mockReturnValue(false)
        await expect(service.createOrder(payload, metadata)).rejects.toMatchObject({
          statusCode: 422,
        })
        expect(apiServiceMock.getKits).not.toHaveBeenCalled()
      })

      it('should fail with a clear 422 when the kit is activated for a different pet', async () => {
        apiServiceMock.getKits.mockResolvedValue(
          buildKitsResponse(
            { code: 'VRHPBBN', activated: true },
            { name: 'Rex', species: 'dog', 'owner-last-name': 'Greco' },
          ),
        )
        await expect(service.createOrder(payload, metadata)).rejects.toThrow(
          /already activated for pet 'Rex'/,
        )
      })

      it('should propagate the original 422 when no kit is found', async () => {
        apiServiceMock.getKits.mockResolvedValue({ data: [], included: [] })
        await expect(service.createOrder(payload, metadata)).rejects.toMatchObject({
          statusCode: 422,
        })
      })

      it('should propagate the original 422 when the kit is not activated', async () => {
        apiServiceMock.getKits.mockResolvedValue(
          buildKitsResponse(
            { code: 'VRHPBBN', activated: false },
            { name: 'Firulais', species: 'dog', 'owner-last-name': 'Greco' },
          ),
        )
        await expect(service.createOrder(payload, metadata)).rejects.toMatchObject({
          statusCode: 422,
        })
      })

      it('should propagate the original 422 when the kit lookup fails', async () => {
        apiServiceMock.getKits.mockRejectedValue(new Error('connection refused'))
        await expect(service.createOrder(payload, metadata)).rejects.toMatchObject({
          statusCode: 422,
        })
      })

      it('should not attempt recovery for non-422 errors', async () => {
        apiServiceMock.createPet.mockRejectedValue(
          new WisdomApiException('Failed to create pet', 500, new Error('Internal Server Error')),
        )
        await expect(service.createOrder(payload, metadata)).rejects.toMatchObject({
          statusCode: 500,
        })
        expect(apiServiceMock.getKits).not.toHaveBeenCalled()
      })
    })
  })

  describe('getBatchOrders()', () => {
    it('should propagate the provider status code when fetching kits fails', async () => {
      const payload = {} as unknown as NullPayloadPayload
      const metadata = {
        integrationOptions: { hospitalNumber: '123' },
        providerConfiguration: {},
      } as unknown as WisdomPanelMessageData
      apiServiceMock.getUnacknowledgedKitsForHospital.mockRejectedValue(
        new WisdomApiException('Failed to get kits', 401, new Error('Unauthorized')),
      )
      await expect(service.getBatchOrders(payload, metadata)).rejects.toMatchObject({
        statusCode: 401,
      })
    })
  })

  describe('getBatchResults()', () => {
    it("should fetch the PDF report from Wisdom's API", async () => {
      const payload = {} as unknown as NullPayloadPayload
      const metadata = {
        integrationOptions: {
          hospitalNumber: '123',
        },
        providerConfiguration: {},
      } as unknown as WisdomPanelMessageData
      apiServiceMock.getUnacknowledgedResultSetsForHospital.mockResolvedValueOnce({
        data: [
          {
            id: 'result-set-id',
            relationships: {
              kit: {
                data: {
                  id: 'kit-id',
                },
              },
            },
          },
        ],
        included: [
          {
            type: 'kits',
            id: 'kit-id',
            attributes: {
              code: 'XOXOXO',
            },
          },
        ],
      })
      apiServiceMock.getSimplifiedResultSets.mockResolvedValueOnce({})
      const batchResultsResponse: BatchResultsResponse = await service.getBatchResults(
        payload,
        metadata,
      )
      expect(batchResultsResponse.results).toHaveLength(1)
      expect(apiServiceMock.getReportPdfBase64).toBeCalledWith('kit-id', expect.any(Object))
    })
  })
})

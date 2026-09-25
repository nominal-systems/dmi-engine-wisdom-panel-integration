import { WisdomPanelService } from './wisdom-panel.service'
import { Logger } from '@nestjs/common'
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
    getPet: jest.fn(),
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
          voyager_pet_id: '434956978',
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
        apiServiceMock.getPet.mockResolvedValue({
          message: 'success',
          data: {
            pet: { id: 'pet-id-1', name: 'Firulais' },
            kit: { id: 'kit-id-1', code: 'VRHPBBN' },
            requisition_form: 'base64 pdf',
          },
        })
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
        expect(apiServiceMock.getPet).toHaveBeenCalledWith(
          'VRHPBBN',
          '434956978',
          expect.any(Object),
        )
        expect(response).toEqual({
          externalId: 'kit-id-1',
          requisitionId: 'VRHPBBN',
          status: OrderStatus.SUBMITTED,
          manifest: {
            contentType: 'application/pdf',
            data: 'base64 pdf',
          },
        })
      })

      it('should not recover when Wisdom Panel does not match the kit to the submitted patient', async () => {
        apiServiceMock.getKits.mockResolvedValue(
          buildKitsResponse(
            { code: 'VRHPBBN', activated: true },
            { name: 'Firulais', species: 'dog', 'owner-last-name': 'Greco' },
          ),
        )
        apiServiceMock.getPet.mockRejectedValue(
          new WisdomApiException(
            'Failed to get pet',
            422,
            new Error('WIS_VOY__105: Failed: Kit VRHPBBN could not be found.'),
          ),
        )
        await expect(service.createOrder(payload, metadata)).rejects.toMatchObject({
          statusCode: 422,
          message: "Kit 'VRHPBBN' is activated for a different patient than the one submitted",
        })
      })

      it('should not recover when the order carries no patient id', async () => {
        mapperMock.mapCreateOrderPayload.mockReturnValue({
          data: { ...createPetPayload.data, voyager_pet_id: '' },
        })
        apiServiceMock.getKits.mockResolvedValue(
          buildKitsResponse(
            { code: 'VRHPBBN', activated: true },
            { name: 'Firulais', species: 'dog', 'owner-last-name': 'Greco' },
          ),
        )
        await expect(service.createOrder(payload, metadata)).rejects.toMatchObject({
          statusCode: 422,
        })
        expect(apiServiceMock.getPet).not.toHaveBeenCalled()
      })

      it('should recover without a manifest when the requisition form cannot be fetched', async () => {
        apiServiceMock.getKits.mockResolvedValue(
          buildKitsResponse(
            { code: 'VRHPBBN', activated: true },
            { name: 'Firulais', species: 'dog', 'owner-last-name': 'Greco' },
          ),
        )
        apiServiceMock.getPet.mockRejectedValue(
          new WisdomApiException('Failed to get pet', 429, new Error('Too Many Requests')),
        )
        const response: OrderCreatedResponse = await service.createOrder(payload, metadata)
        expect(response).toEqual({
          externalId: 'kit-id-1',
          requisitionId: 'VRHPBBN',
          status: OrderStatus.SUBMITTED,
          manifest: null,
        })
      })

      it('should recover without a manifest when the response carries no requisition form', async () => {
        apiServiceMock.getKits.mockResolvedValue(
          buildKitsResponse(
            { code: 'VRHPBBN', activated: true },
            { name: 'Firulais', species: 'dog', 'owner-last-name': 'Greco' },
          ),
        )
        apiServiceMock.getPet.mockResolvedValue({
          message: 'success',
          data: { pet: {}, kit: { id: 'kit-id-1', code: 'VRHPBBN' } },
        })
        const response: OrderCreatedResponse = await service.createOrder(payload, metadata)
        expect(response.manifest).toBeNull()
      })

      it('should not attempt recovery when the flag is disabled', async () => {
        featureFlagProviderMock.isEnabled.mockReturnValue(false)
        await expect(service.createOrder(payload, metadata)).rejects.toMatchObject({
          statusCode: 422,
        })
        expect(apiServiceMock.getKits).not.toHaveBeenCalled()
        expect(apiServiceMock.getPet).not.toHaveBeenCalled()
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
        expect(apiServiceMock.getPet).not.toHaveBeenCalled()
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
    beforeEach(() => {
      mapperMock.mapWisdomPanelResult
        .mockReset()
        .mockImplementation((resultSet) => ({ id: resultSet.id }))
    })

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

    describe('result set isolation', () => {
      const payload = {} as unknown as NullPayloadPayload
      const metadata = {
        integrationOptions: { hospitalNumber: '123' },
        providerConfiguration: {},
      } as unknown as WisdomPanelMessageData

      const buildResultSetsResponse = (count: number) => ({
        data: Array.from({ length: count }, (_, i) => ({
          id: `result-set-${i + 1}`,
          type: 'result-sets',
          relationships: { kit: { data: { type: 'kits', id: `kit-${i + 1}` } } },
        })),
        included: Array.from({ length: count }, (_, i) => ({
          id: `kit-${i + 1}`,
          type: 'kits',
          attributes: { code: `KIT000${i + 1}` },
        })),
      })

      const pdfError = (status: number) =>
        new WisdomApiException(
          `[HTTP ${status}] Failed to GET https://api.example.com/pdf-generator/vet-report/kit-2`,
          status,
          new Error('Failed to GET https://api.example.com/pdf-generator/vet-report/kit-2'),
        )

      const pdfFailsFor = (failingKitId: string, error: Error) => {
        apiServiceMock.getReportPdfBase64.mockImplementation(async (kitId: string) => {
          if (kitId === failingKitId) {
            throw error
          }
          return 'base64 pdf'
        })
      }

      let warnSpy: jest.SpyInstance
      let errorSpy: jest.SpyInstance

      beforeEach(() => {
        warnSpy = jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined)
        errorSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined)
        apiServiceMock.getUnacknowledgedResultSetsForHospital.mockReset()
        apiServiceMock.getSimplifiedResultSets.mockReset().mockResolvedValue({
          message: 'success',
          data: { notable_and_at_risk_health_test_results: [] },
        })
        apiServiceMock.getReportPdfBase64.mockReset().mockResolvedValue('base64 pdf')
      })

      afterEach(() => {
        warnSpy.mockRestore()
        errorSpy.mockRestore()
      })

      it('should return every result set when all report PDFs are available', async () => {
        apiServiceMock.getUnacknowledgedResultSetsForHospital.mockResolvedValue(
          buildResultSetsResponse(3),
        )
        const response: BatchResultsResponse = await service.getBatchResults(payload, metadata)
        expect(response.results).toEqual([
          { id: 'result-set-1' },
          { id: 'result-set-2' },
          { id: 'result-set-3' },
        ])
        expect(apiServiceMock.getReportPdfBase64).toHaveBeenCalledTimes(3)
        expect(warnSpy).not.toHaveBeenCalled()
        expect(errorSpy).not.toHaveBeenCalled()
      })

      it('should leave a result set whose report PDF is not available yet unacknowledged', async () => {
        apiServiceMock.getUnacknowledgedResultSetsForHospital.mockResolvedValue(
          buildResultSetsResponse(3),
        )
        pdfFailsFor('kit-2', pdfError(404))
        const response: BatchResultsResponse = await service.getBatchResults(payload, metadata)
        expect(response.results).toEqual([{ id: 'result-set-1' }, { id: 'result-set-3' }])
        expect(mapperMock.mapWisdomPanelResult).toHaveBeenCalledTimes(2)
        expect(warnSpy).toHaveBeenCalledTimes(1)
        expect(warnSpy).toHaveBeenCalledWith(
          expect.stringMatching(/result-set-2.*leaving it unacknowledged/),
        )
        expect(errorSpy).not.toHaveBeenCalled()
      })

      it('should skip a result set whose report PDF fails with another status', async () => {
        apiServiceMock.getUnacknowledgedResultSetsForHospital.mockResolvedValue(
          buildResultSetsResponse(3),
        )
        pdfFailsFor('kit-2', pdfError(500))
        const response: BatchResultsResponse = await service.getBatchResults(payload, metadata)
        expect(response.results).toEqual([{ id: 'result-set-1' }, { id: 'result-set-3' }])
        expect(errorSpy).toHaveBeenCalledTimes(1)
        expect(errorSpy).toHaveBeenCalledWith(
          expect.stringMatching(/result-set-2.*leaving it unacknowledged/),
          expect.any(String),
        )
        expect(warnSpy).not.toHaveBeenCalled()
      })

      it('should not treat a 404 on the simplified results as a pending report', async () => {
        apiServiceMock.getUnacknowledgedResultSetsForHospital.mockResolvedValue(
          buildResultSetsResponse(1),
        )
        apiServiceMock.getSimplifiedResultSets.mockRejectedValue(
          new WisdomApiException('[HTTP 404] Failed to GET', 404, new Error('Failed to GET')),
        )
        const response: BatchResultsResponse = await service.getBatchResults(payload, metadata)
        expect(response.results).toEqual([])
        expect(apiServiceMock.getReportPdfBase64).not.toHaveBeenCalled()
        expect(errorSpy).toHaveBeenCalledTimes(1)
        expect(warnSpy).not.toHaveBeenCalled()
      })

      it('should skip a result set that fails to map', async () => {
        apiServiceMock.getUnacknowledgedResultSetsForHospital.mockResolvedValue(
          buildResultSetsResponse(3),
        )
        mapperMock.mapWisdomPanelResult.mockImplementation((resultSet) => {
          if (resultSet.id === 'result-set-2') {
            throw new TypeError('Cannot convert undefined or null to object')
          }
          return { id: resultSet.id }
        })
        const response: BatchResultsResponse = await service.getBatchResults(payload, metadata)
        expect(response.results).toEqual([{ id: 'result-set-1' }, { id: 'result-set-3' }])
        expect(errorSpy).toHaveBeenCalledTimes(1)
        expect(errorSpy).toHaveBeenCalledWith(
          expect.stringContaining('result-set-2'),
          expect.any(String),
        )
      })

      it('should return a result set once its report PDF becomes available', async () => {
        apiServiceMock.getUnacknowledgedResultSetsForHospital.mockResolvedValue(
          buildResultSetsResponse(1),
        )
        apiServiceMock.getReportPdfBase64
          .mockRejectedValueOnce(pdfError(404))
          .mockResolvedValueOnce('base64 pdf')
        const firstPoll: BatchResultsResponse = await service.getBatchResults(payload, metadata)
        expect(firstPoll.results).toEqual([])
        const secondPoll: BatchResultsResponse = await service.getBatchResults(payload, metadata)
        expect(secondPoll.results).toEqual([{ id: 'result-set-1' }])
      })

      it('should still fail the batch when the result sets cannot be listed', async () => {
        apiServiceMock.getUnacknowledgedResultSetsForHospital.mockRejectedValue(
          new Error('[HTTP 503] Failed to GET https://api.example.com/api/v1/result-sets'),
        )
        await expect(service.getBatchResults(payload, metadata)).rejects.toThrow(
          /^Failed to get batch results: /,
        )
      })
    })
  })
})

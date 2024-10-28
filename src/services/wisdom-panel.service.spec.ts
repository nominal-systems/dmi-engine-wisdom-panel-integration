import { WisdomPanelService } from './wisdom-panel.service'
import { Test, TestingModule } from '@nestjs/testing'
import { WisdomPanelApiService } from '../wisdom-panel-api/wisdom-panel-api.service'
import { WisdomPanelMapper } from '../providers/wisdom-panel-mapper'
import {
  BatchResultsResponse,
  CreateOrderPayload,
  NullPayloadPayload,
  OrderCreatedResponse
} from '@nominal-systems/dmi-engine-common'
import { WisdomPanelMessageData } from '../interfaces/wisdom-panel-message-data.interface'
import { ConfigService } from '@nestjs/config'

describe('WisdomPanelService', () => {
  let service: WisdomPanelService
  const mapperMock = {
    mapCreateOrderPayload: jest.fn(),
    mapWisdomPanelResult: jest.fn()
  }
  const apiServiceMock = {
    createPet: jest.fn(),
    getUnacknowledgedResultSetsForHospital: jest.fn(),
    getSimplifiedResultSets: jest.fn(),
    getReportPdfBase64: jest.fn(),
    acknowledgeKits: jest.fn(),
    acknowledgeResultSets: jest.fn()
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
            code: 'AAA'
          },
          requisition_form: 'base64 pdf'
        }
      })
      const response: OrderCreatedResponse = await service.createOrder(payload, metadata)
      expect(mapperMock.mapCreateOrderPayload).toHaveBeenCalled()
      expect(apiServiceMock.createPet).toHaveBeenCalled()
      expect(response).toEqual({
        externalId: 'test-id',
        requisitionId: 'AAA',
        status: expect.any(String),
        manifest: expect.objectContaining({
          data: expect.any(String)
        })
      })
    })
  })

  describe('getBatchResults()', () => {
    it("should fetch the PDF report from Wisdom's API", async () => {
      const payload = {} as unknown as NullPayloadPayload
      const metadata = {
        integrationOptions: {
          hospitalNumber: '123'
        },
        providerConfiguration: {}
      } as unknown as WisdomPanelMessageData
      apiServiceMock.getUnacknowledgedResultSetsForHospital.mockResolvedValueOnce({
        data: [
          {
            id: 'result-set-id',
            relationships: {
              kit: {
                data: {
                  id: 'kit-id'
                }
              }
            }
          }
        ],
        included: [
          {
            type: 'kits',
            id: 'kit-id',
            attributes: {
              code: 'XOXOXO'
            }
          }
        ]
      })
      apiServiceMock.getSimplifiedResultSets.mockResolvedValueOnce({})
      const batchResultsResponse: BatchResultsResponse = await service.getBatchResults(payload, metadata)
      expect(batchResultsResponse.results).toHaveLength(1)
      expect(apiServiceMock.getReportPdfBase64).toBeCalledWith('kit-id', expect.any(Object))
    })

    it('should not continue processing if the result set is not ready yet', async () => {
      const payload = {} as unknown as NullPayloadPayload
      const metadata = {
        integrationOptions: {
          hospitalNumber: '123'
        },
        providerConfiguration: {}
      } as unknown as WisdomPanelMessageData
      apiServiceMock.getUnacknowledgedResultSetsForHospital.mockResolvedValueOnce({
        data: [
          {
            id: 'result-set-id',
            relationships: {
              kit: {
                data: {
                  id: 'kit-id'
                }
              }
            }
          }
        ],
        included: [
          {
            type: 'kits',
            id: 'kit-id',
            attributes: {
              code: 'XOXOXO'
            }
          }
        ]
      })
      apiServiceMock.getSimplifiedResultSets.mockResolvedValueOnce({
        message: "WIS_VOY__107: Results for kit with id kit-id are not ready yet."
      })
      const batchResultsResponse: BatchResultsResponse = await service.getBatchResults(payload, metadata)
      expect(batchResultsResponse.results).toHaveLength(0)
      expect(apiServiceMock.getReportPdfBase64).not.toHaveBeenCalled()
      expect(mapperMock.mapWisdomPanelResult).not.toHaveBeenCalled()

    })

    it('should acknowledge the kit and result set if result sets have failed', async () => {
      const payload = {} as unknown as NullPayloadPayload
      const metadata = {
        integrationOptions: {
          hospitalNumber: '123'
        },
        providerConfiguration: {}
      } as unknown as WisdomPanelMessageData
      apiServiceMock.getUnacknowledgedResultSetsForHospital.mockResolvedValueOnce({
        data: [
          {
            id: 'result-set-id',
            relationships: {
              kit: {
                data: {
                  id: 'kit-id'
                }
              }
            }
          }
        ],
        included: [
          {
            type: 'kits',
            id: 'kit-id',
            attributes: {
              code: 'XOXOXO'
            }
          }
        ]
      })
      apiServiceMock.getSimplifiedResultSets.mockResolvedValueOnce({
        message: "WIS_VOY__108: Kit analysis has resulted in a failure during the [stage] stage with status code [failure_status]."
      })
      const batchResultsResponse: BatchResultsResponse = await service.getBatchResults(payload, metadata)
      expect(batchResultsResponse.results).toHaveLength(0)
      expect(apiServiceMock.acknowledgeKits).toBeCalledWith(['kit-id'], expect.any(Object))
      expect(apiServiceMock.acknowledgeResultSets).toBeCalledWith(['result-set-id'], expect.any(Object))
      expect(apiServiceMock.getReportPdfBase64).not.toHaveBeenCalled()
      expect(mapperMock.mapWisdomPanelResult).not.toHaveBeenCalled()
    })
  })
})

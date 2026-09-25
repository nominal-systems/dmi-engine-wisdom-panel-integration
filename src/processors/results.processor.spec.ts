import { Test, TestingModule } from '@nestjs/testing'
import { ConfigService } from '@nestjs/config'
import { ResultsProcessor } from './results.processor'
import { WisdomPanelService } from '../services/wisdom-panel.service'

describe('ResultsProcessor', () => {
  let processor: ResultsProcessor

  const configServiceMock = {
    get: jest.fn(),
  }

  const wisdomPanelServiceMock = {
    getBatchResults: jest.fn(),
    acknowledgeResult: jest.fn(),
  }

  const apiClientMock = {
    emit: jest.fn(),
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ResultsProcessor,
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

    processor = module.get<ResultsProcessor>(ResultsProcessor)
    jest.clearAllMocks()
  })

  it('should be defined', () => {
    expect(processor).toBeDefined()
  })

  it('should rethrow when getBatchResults fails', async () => {
    const error = new Error('results failed')
    const job = {
      data: {
        payload: {
          integrationId: 'integration-1',
        },
      },
    } as any

    wisdomPanelServiceMock.getBatchResults.mockRejectedValueOnce(error)

    await expect(processor.fetchResults(job)).rejects.toThrow(error)
  })

  it('should emit and acknowledge every result returned by getBatchResults', async () => {
    const job = {
      data: {
        payload: {
          integrationId: 'integration-1',
        },
        integrationOptions: { hospitalNumber: '123' },
        providerConfiguration: {},
      },
    } as any
    const results = [{ id: 'result-set-1' }, { id: 'result-set-3' }]

    wisdomPanelServiceMock.getBatchResults.mockResolvedValueOnce({ results })

    await processor.fetchResults(job)

    const data = { integrationId: 'integration-1', results }
    expect(apiClientMock.emit).toHaveBeenCalledTimes(2)
    expect(apiClientMock.emit).toHaveBeenNthCalledWith(1, 'external_order_results', data)
    expect(apiClientMock.emit).toHaveBeenNthCalledWith(2, 'external_results', data)
    expect(wisdomPanelServiceMock.acknowledgeResult).toHaveBeenCalledTimes(2)
    const metadata = { integrationOptions: { hospitalNumber: '123' }, providerConfiguration: {} }
    expect(wisdomPanelServiceMock.acknowledgeResult).toHaveBeenNthCalledWith(
      1,
      { id: 'result-set-1' },
      metadata,
    )
    expect(wisdomPanelServiceMock.acknowledgeResult).toHaveBeenNthCalledWith(
      2,
      { id: 'result-set-3' },
      metadata,
    )
  })
})

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
})

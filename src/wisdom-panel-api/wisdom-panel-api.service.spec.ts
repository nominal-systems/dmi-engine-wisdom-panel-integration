import { Test, TestingModule } from '@nestjs/testing'
import { CACHE_MANAGER, CacheStore } from '@nestjs/cache-manager'
import { WisdomPanelApiService } from './wisdom-panel-api.service'
import { WisdomPanelApiHttpService } from './wisdom-panel-api-http.service'
import { WisdomPanelApiConfig } from '../interfaces/wisdom-panel-api-payloads.interface'
import { OAuthTokenResponse } from '../interfaces/wisdom-panel-api-responses.interface'
import { of, throwError } from 'rxjs'
import { AxiosRequestHeaders } from 'axios'

describe('WisdomPanelApiService', () => {
  let service: WisdomPanelApiService
  let cacheManager: CacheStore
  let httpService: WisdomPanelApiHttpService

  const configMock: WisdomPanelApiConfig = {
    baseUrl: 'https://api.example.com',
    username: 'testuser',
    password: 'testpass'
  }

  const tokenResponseMock: OAuthTokenResponse = {
    access_token: 'mockAccessToken',
    expires_in: 3600,
    token_type: 'Bearer',
    scope: 'organization',
    created_at: 1234567890
  }

  const httpResponseMock = (status, statusText, data) => {
    return of({
      data,
      headers: {},
      config: {
        url: 'ss',
        headers: {} as AxiosRequestHeaders
      },
      status,
      statusText
    })
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WisdomPanelApiService,
        {
          provide: CACHE_MANAGER,
          useValue: {
            get: jest.fn(),
            set: jest.fn()
          }
        },
        {
          provide: WisdomPanelApiHttpService,
          useValue: {
            get: jest.fn(),
            post: jest.fn()
          }
        }
      ]
    }).compile()

    service = module.get<WisdomPanelApiService>(WisdomPanelApiService)
    cacheManager = module.get<CacheStore>(CACHE_MANAGER)
    httpService = module.get<WisdomPanelApiHttpService>(WisdomPanelApiHttpService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  describe('authenticate', () => {
    it('should use a token from the cache if available', async () => {
      jest.spyOn(cacheManager, 'get').mockReturnValue('mockAccessToken')
      const token: string = await service.authenticate(configMock)
      expect(cacheManager.get).toHaveBeenCalledWith(`access_token-${configMock.username}`)
      expect(httpService.post).not.toHaveBeenCalled()
      expect(cacheManager.set).not.toHaveBeenCalled()
      expect(token).toEqual('mockAccessToken')
    })

    it('should fetch a new token if not available in cache', async () => {
      jest.spyOn(cacheManager, 'get').mockReturnValue(undefined)
      jest.spyOn(httpService, 'post').mockReturnValue(httpResponseMock(200, 'OK', tokenResponseMock))
      const token: string = await service.authenticate(configMock)
      expect(cacheManager.get).toHaveBeenCalledWith(`access_token-${configMock.username}`)
      expect(httpService.post).toHaveBeenCalled()
      expect(cacheManager.set).toHaveBeenCalledWith(
        `access_token-${configMock.username}`,
        'mockAccessToken',
        tokenResponseMock.expires_in * 0.25 * 1000
      )
      expect(token).toEqual('mockAccessToken')
    })

    it('should fetch a new token if forced', async () => {
      jest.spyOn(httpService, 'post').mockReturnValue(httpResponseMock(200, 'OK', tokenResponseMock))
      const token: string = await service.authenticate(configMock, false)
      expect(cacheManager.get).not.toHaveBeenCalled()
      expect(httpService.post).toHaveBeenCalled()
      expect(cacheManager.set).not.toHaveBeenCalledWith(
        `access_token-${configMock.username}`,
        'mockAccessToken',
        tokenResponseMock.expires_in * 0.25 * 1000
      )
      expect(token).toEqual('mockAccessToken')
    })

    it('should throw an error if the request fails', async () => {
      jest.spyOn(httpService, 'post').mockImplementation((status, message) => {
        return throwError(() => new Error(message))
      })
      await expect(service.authenticate(configMock)).rejects.toThrowError()
    })
  })
})

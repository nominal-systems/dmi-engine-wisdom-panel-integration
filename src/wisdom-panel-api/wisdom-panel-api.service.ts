import { Inject, Injectable, Logger } from '@nestjs/common'
import { BaseApiService } from '@nominal-systems/dmi-engine-common'
import {
  WisdomPanelApiConfig,
  WisdomPanelCreatePetPayload,
  WisdomPanelInclude,
  WisdomPanelKitFiler,
  WisdomPanelResultSetsFilter
} from '../interfaces/wisdom-panel-api-payloads.interface'
import {
  OAuthTokenResponse,
  WisdomPanelKitItem,
  WisdomPanelKitsResponse,
  WisdomPanelPetCreatedResponse,
  WisdomPanelResultSetsResponse,
  WisdomPanelSimpleResultResponse
} from '../interfaces/wisdom-panel-api-responses.interface'
import { WisdomPanelApiEndpoints } from '../interfaces/wisdom-panel-api-endpoints.interface'
import { CACHE_MANAGER, CacheStore } from '@nestjs/cache-manager'
import { WisdomApiException } from '../exceptions/wisdom-api.exception'
import { ResponseType } from 'axios'
import { WisdomPanelApiHttpService } from './wisdom-panel-api-http.service'

@Injectable()
export class WisdomPanelApiService extends BaseApiService {
  private readonly logger: Logger = new Logger(WisdomPanelApiService.name)

  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: CacheStore,
    private readonly httpService: WisdomPanelApiHttpService
  ) {
    super(httpService)
  }

  async authenticate(config: WisdomPanelApiConfig, useCache = true): Promise<string> {
    let token: string | undefined = undefined
    const key = `access_token-${config.username}`
    if (useCache) {
      token = await this.cacheManager.get<string>(key)
    }
    if (!token) {
      try {
        const payload = {
          username: config.username,
          password: config.password,
          grant_type: 'password',
          scope: 'organization'
        }
        const response = await this.post<OAuthTokenResponse>(
          `${config.baseUrl}${WisdomPanelApiEndpoints.AUTH}`,
          payload,
          {}
        )
        token = response.access_token
        this.logger.debug(`Got new token: ${token.slice(-4)} (expires in ${response.expires_in} seconds)`)
        if (useCache) {
          const ttl = response.expires_in * 0.25 * 1000
          await this.cacheManager.set(key, token, ttl)
          this.logger.debug(`Saved new token '${key}' in cache: ${token.slice(-4)} (ttl: ${ttl / 1000}s)`)
        }
      } catch (error) {
        throw new Error(`[HTTP ${error.status}] ${error.message}`)
      }
    }
    return token
  }

  async getKits(
    filter: WisdomPanelKitFiler = {},
    include: WisdomPanelInclude = {},
    config: WisdomPanelApiConfig
  ): Promise<WisdomPanelKitsResponse> {
    try {
      const token = await this.authenticate(config)
      const query = {
        ...include
      }
      for (const key of Object.keys(filter)) {
        query[`filter[${key}]`] = filter[key]
      }
      const reqConfig = {
        params: query,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      }
      return await this.get<WisdomPanelKitsResponse>(`${config.baseUrl}${WisdomPanelApiEndpoints.GET_KITS}`, reqConfig)
    } catch (error) {
      throw new WisdomApiException('Failed to get kits', error.status, error)
    }
  }

  async getResultSets(
    filter: WisdomPanelResultSetsFilter = {},
    include: WisdomPanelInclude = {},
    config: WisdomPanelApiConfig
  ): Promise<WisdomPanelResultSetsResponse> {
    try {
      const token = await this.authenticate(config)
      const query = {
        ...include
      }
      for (const key of Object.keys(filter)) {
        query[`filter[${key}]`] = filter[key]
      }
      const reqConfig = {
        params: query,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      }
      return await this.get<WisdomPanelResultSetsResponse>(
        `${config.baseUrl}${WisdomPanelApiEndpoints.GET_RESULT_SETS}`,
        reqConfig
      )
    } catch (error) {
      throw new Error(`[HTTP ${error.status}] ${error.message}`)
    }
  }

  async getSimplifiedResultSets(kitId: string, config: WisdomPanelApiConfig): Promise<WisdomPanelSimpleResultResponse> {
    try {
      const token = await this.authenticate(config)
      const reqConfig = {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      }
      return await this.get<WisdomPanelSimpleResultResponse>(
        `${config.baseUrl}${WisdomPanelApiEndpoints.GET_SIMPLIFIED_RESULT_SETS}/${kitId}`,
        reqConfig
      )
    } catch (error) {
      throw new Error(`[HTTP ${error.status}] ${error.message}`)
    }
  }

  async getReportPdfBase64(kitId: string, config: WisdomPanelApiConfig): Promise<string> {
    try {
      const token = await this.authenticate(config)
      const reqConfig = {
        responseType: 'arraybuffer' as ResponseType,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      }
      const response = await this.get<ArrayBuffer>(
        `${config.baseUrl}${WisdomPanelApiEndpoints.GET_REPORT_PDF}/${kitId}`,
        reqConfig
      )
      return Buffer.from(response).toString('base64')
    } catch (error) {
      throw new Error(`[HTTP ${error.status}] ${error.message}`)
    }
  }

  async getUnacknowledgedResultSetsForHospital(
    hospitalNumber: string,
    config: WisdomPanelApiConfig
  ): Promise<WisdomPanelResultSetsResponse> {
    const filter: WisdomPanelResultSetsFilter = {
      unacknowledged: true,
      hospital_number: hospitalNumber
    }

    return await this.getResultSets(filter, { include: 'kit' }, config)
  }

  async getUnacknowledgedKitsForHospital(
    hospitalNumber: string,
    config: WisdomPanelApiConfig
  ): Promise<WisdomPanelKitsResponse> {
    const filter: WisdomPanelKitFiler = {
      unacknowledged: true,
      hospital_number: hospitalNumber
    }

    const include: WisdomPanelInclude = {
      include: ['pet', 'pet.owner'].join(',')
    }

    return await this.getKits(filter, include, config)
  }

  async getAvailableKits(config: WisdomPanelApiConfig): Promise<WisdomPanelKitItem[]> {
    const filter: WisdomPanelKitFiler = {
      activated: false,
      voyager_kits: true
    }
    const response = await this.getKits(filter, {}, config)

    response.data = response.data.filter((kit) => kit.attributes['active'] && !kit.attributes['activated'])
    return response.data
  }

  async createPet(
    payload: WisdomPanelCreatePetPayload,
    config: WisdomPanelApiConfig
  ): Promise<WisdomPanelPetCreatedResponse> {
    try {
      const token = await this.authenticate(config)
      const reqConfig = {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      }
      return await this.post(`${config.baseUrl}${WisdomPanelApiEndpoints.CREATE_PET}`, payload, reqConfig)
    } catch (err) {
      throw new WisdomApiException('Failed to create pet', err.status, err)
    }
  }

  async acknowledgeKits(kitIds: string[], config: WisdomPanelApiConfig): Promise<void> {
    try {
      const token = await this.authenticate(config)
      const reqConfig = {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      }
      const payload = {
        data: {
          kit_ids: kitIds
        }
      }
      await this.post(`${config.baseUrl}${WisdomPanelApiEndpoints.ACKNOWLEDGE_KITS}`, payload, reqConfig)
      this.logger.debug(`Acknowledged ${kitIds.length} kit${kitIds.length > 1 ? 's' : ''}: ${kitIds.join(', ')}`)
    } catch (err) {
      throw new WisdomApiException('Failed to acknowledge kits', err.status, err)
    }
  }

  async acknowledgeResultSets(resultSetIds: string[], config: WisdomPanelApiConfig): Promise<void> {
    try {
      const token = await this.authenticate(config)
      const reqConfig = {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      }
      const payload = {
        data: {
          result_set_ids: resultSetIds
        }
      }
      await this.post(`${config.baseUrl}${WisdomPanelApiEndpoints.ACKNOWLEDGE_RESULT_SETS}`, payload, reqConfig)
      this.logger.debug(
        `Acknowledged ${resultSetIds.length} result set${resultSetIds.length > 1 ? 's' : ''}: ${resultSetIds.join(', ')}`
      )
    } catch (error) {
      throw new Error(`[HTTP ${error.status}] ${error.message}`)
    }
  }

  async testAuth(config: WisdomPanelApiConfig): Promise<void> {
    try {
      await this.authenticate(config, false)
    } catch (error) {
      throw new WisdomApiException('Failed to authenticate', error.status, error)
    }
  }
}

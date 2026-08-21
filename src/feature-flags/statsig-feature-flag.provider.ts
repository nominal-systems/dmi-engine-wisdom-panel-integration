import { Injectable, Logger, OnModuleInit } from '@nestjs/common'
import Statsig from 'statsig-node'
import { type FeatureFlagContext, type FeatureFlagProvider } from './feature-flag.interface'

@Injectable()
export class StatsigFeatureFlagProvider implements FeatureFlagProvider, OnModuleInit {
  private readonly logger = new Logger(StatsigFeatureFlagProvider.name)
  private initialized = false

  private getStringValue(value: unknown): string | undefined {
    if (typeof value !== 'string') {
      return undefined
    }

    const trimmed = value.trim()
    return trimmed.length > 0 ? trimmed : undefined
  }

  async onModuleInit() {
    const secretKey = process.env.STATSIG_SERVER_SECRET_KEY
    if (!secretKey) {
      this.logger.warn('STATSIG_SERVER_SECRET_KEY not set, Statsig disabled')
      return
    }

    try {
      await Statsig.initialize(secretKey, {
        environment: { tier: process.env.STATSIG_ENVIRONMENT || 'development' },
      })
      this.initialized = true
      this.logger.log('Statsig initialized successfully')
    } catch (error) {
      this.logger.error('Failed to initialize Statsig', error)
    }
  }

  isEnabled(flag: string, context?: FeatureFlagContext): boolean {
    if (!this.initialized) {
      this.logger.debug(`Statsig not initialized, flag "${flag}" returning false (legacy path)`)
      return false
    }

    const custom = context?.custom ?? {}
    const resolvedClinicId =
      this.getStringValue(context?.clinicId) ||
      this.getStringValue(custom.clinicId) ||
      this.getStringValue(custom.clinicid)
    const resolvedIntegrationId =
      this.getStringValue(context?.integrationId) ||
      this.getStringValue(custom.integrationId) ||
      this.getStringValue(custom.integrationid)
    const resolvedUserId =
      this.getStringValue(context?.userID) ||
      resolvedClinicId ||
      resolvedIntegrationId ||
      'anonymous'

    const user = {
      userID: resolvedUserId,
      custom: {
        ...custom,
        clinicId: resolvedClinicId,
        integrationId: resolvedIntegrationId,
      },
    }

    const result = Statsig.checkGate(user, flag)

    this.logger.debug(
      `Flag "${flag}" for clinicId=${resolvedClinicId}, integrationId=${resolvedIntegrationId}, userID=${resolvedUserId}: ${result}`,
    )

    return result
  }
}

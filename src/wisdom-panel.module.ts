import { DynamicModule, Module, ModuleMetadata, Provider } from '@nestjs/common'
import { APP_INTERCEPTOR } from '@nestjs/core'
import { IntegrationContextInterceptor } from '@nominal-systems/dmi-engine-common'
import { ClientsModule, Transport } from '@nestjs/microservices'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { BullModule } from '@nestjs/bull'
import { WisdomPanelService } from './services/wisdom-panel.service'
import { WisdomPanelMapper } from './providers/wisdom-panel-mapper'
import { WisdomPanelApiService } from './wisdom-panel-api/wisdom-panel-api.service'
import { WisdomPanelController } from './controllers/wisdom-panel.controller'
import { OrdersProcessor } from './processors/orders.processors'
import { ResultsProcessor } from './processors/results.processor'
import { CacheModule } from '@nestjs/cache-manager'
import configuration from './config/configuration'
import { WisdomPanelApiModule } from './wisdom-panel-api/wisdom-panel-api.module'
import { PROVIDER_NAME } from './constants/provider-name'
import { FEATURE_FLAG_PROVIDER } from './feature-flags/feature-flag.interface'
import { StatsigFeatureFlagProvider } from './feature-flags/statsig-feature-flag.provider'

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    CacheModule.register({
      ttl: 24 * 60 * 60 * 1000,
    }),
    // TODO(gb): extract this to a separate module?
    ClientsModule.registerAsync([
      {
        name: 'API_SERVICE',
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: async (configService: ConfigService) => ({
          transport: Transport.MQTT,
          options: {
            ...configService.get('mqtt'),
          },
        }),
      },
    ]),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        redis: configService.get('redis'),
      }),
    }),
    BullModule.registerQueue(
      // Hash-tagged prefix (same convention as the host app's queue registration) so that all
      // keys of a queue hash to the same slot on clustered Redis; without it, Bull's multi-key
      // Lua scripts fail with CROSSSLOT.
      { name: `${PROVIDER_NAME}.orders`, prefix: `{${PROVIDER_NAME}.orders}` },
      { name: `${PROVIDER_NAME}.results`, prefix: `{${PROVIDER_NAME}.results}` },
    ),
    WisdomPanelApiModule,
  ],
  providers: [
    WisdomPanelService,
    WisdomPanelApiService,
    WisdomPanelMapper,
    OrdersProcessor,
    ResultsProcessor,
    {
      provide: APP_INTERCEPTOR,
      useClass: IntegrationContextInterceptor,
    },
  ],
  controllers: [WisdomPanelController],
  exports: [BullModule],
})
export class WisdomPanelModule {
  static register(options: WisdomPanelModuleOptions = {}): DynamicModule {
    const featureFlagProvider: Provider =
      options.featureFlagProvider ??
      ({ provide: FEATURE_FLAG_PROVIDER, useClass: StatsigFeatureFlagProvider } satisfies Provider)

    return {
      module: WisdomPanelModule,
      imports: [...(options.imports ?? [])],
      providers: [featureFlagProvider, ...(options.providers ?? [])],
    }
  }
}

export interface WisdomPanelModuleOptions {
  imports?: ModuleMetadata['imports']
  providers?: Provider[]
  featureFlagProvider?: Provider
}

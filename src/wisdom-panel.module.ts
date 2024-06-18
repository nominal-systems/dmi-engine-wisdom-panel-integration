import { Module } from '@nestjs/common'
import { ClientsModule, Transport } from '@nestjs/microservices'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { BullModule } from '@nestjs/bull'
import { WisdomPanelService } from './services/wisdom-panel.service'
import { WisdomPanelMapper } from './providers/wisdom-panel-mapper'
import { WisdomPanelApiService } from './services/wisdom-panel-api.service'
import { WisdomPanelController } from './controllers/wisdom-panel.controller'
import { OrdersProcessor } from './processors/orders.processors'
import { ResultsProcessor } from './processors/results.processor'
import { CacheModule } from '@nestjs/cache-manager'
import configuration from './config/configuration'
import { RpcExceptionFilter } from './filters/rcp-exception-filter'
import { APP_FILTER } from '@nestjs/core'
import { WisdomPanelApiModule } from './wisdom-panel-api/wisdom-panel-api.module'

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration]
    }),
    CacheModule.register({
      ttl: 24 * 60 * 60 * 1000
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
            ...configService.get('mqtt')
          }
        })
      }
    ]),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        redis: configService.get('redis')
      })
    }),
    WisdomPanelApiModule
  ],
  providers: [
    WisdomPanelService,
    WisdomPanelApiService,
    WisdomPanelMapper,
    OrdersProcessor,
    ResultsProcessor,
    {
      provide: APP_FILTER,
      useClass: RpcExceptionFilter
    }
  ],
  controllers: [WisdomPanelController],
  exports: [BullModule]
})
export class WisdomPanelModule {}

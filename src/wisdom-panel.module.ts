import { Module } from '@nestjs/common'
import { HttpModule } from '@nestjs/axios'
import { ClientsModule, Transport } from '@nestjs/microservices'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { BullModule } from '@nestjs/bull'
import { WisdomPanelService } from './services/wisdom-panel.service'
import { WisdomPanelMapper } from './providers/wisdom-panel-mapper'
import { WisdomPanelApiService } from './services/wisdom-panel-api.service'
import { WisdomPanelController } from './controllers/wisdom-panel.controller'
import { OrdersProcessor } from './processors/orders.processors'
import { ResultsProcessor } from './processors/results.processor'

@Module({
  imports: [
    HttpModule,
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
    })
  ],
  providers: [
    WisdomPanelService,
    WisdomPanelApiService,
    WisdomPanelMapper,
    OrdersProcessor,
    ResultsProcessor
  ],
  controllers: [
    WisdomPanelController
  ],
  exports: [BullModule]
})
export class WisdomPanelModule {}

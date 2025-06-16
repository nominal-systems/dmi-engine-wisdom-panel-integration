import { Module } from '@nestjs/common'
import { HttpModule, HttpService } from '@nestjs/axios'
import { WisdomPanelApiHttpService } from './wisdom-panel-api-http.service'
import { WisdomPanelApiInterceptor } from './wisdom-panel-api.interceptor'
import { ConfigModule, ConfigService } from '@nestjs/config'
import configuration from '../config/configuration'
import { ClientsModule, Transport } from '@nestjs/microservices'
import { APP_FILTER } from '@nestjs/core'

@Module({
  imports: [
    HttpModule.register({}),
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
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
  ],
  providers: [
    {
      provide: WisdomPanelApiHttpService,
      useExisting: HttpService,
    },
    {
      provide: APP_FILTER,
      useClass: WisdomPanelApiInterceptor,
    },
  ],
  exports: [WisdomPanelApiHttpService],
})
export class WisdomPanelApiModule {
  constructor(private readonly httpService: HttpService) {}
}

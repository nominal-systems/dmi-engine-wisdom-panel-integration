import { NestFactory } from '@nestjs/core'
import { MicroserviceOptions, Transport } from '@nestjs/microservices'
import { ConfigService } from '@nestjs/config'
import { ValidationPipe } from '@nestjs/common'
import { WisdomPanelModule } from './wisdom-panel.module'

async function bootstrap() {
  const app = await NestFactory.create(WisdomPanelModule)
  const configService = app.get<ConfigService<any>>(ConfigService)

  app.connectMicroservice<MicroserviceOptions>(
    {
      transport: Transport.MQTT,
      options: {
        ...configService.get('mqtt'),
      },
    },
    { inheritAppConfig: true },
  )
  app.useGlobalPipes(new ValidationPipe({ transform: true }))
  await app.startAllMicroservices()
}

bootstrap()

import { Injectable } from '@nestjs/common'
import { HttpService } from '@nestjs/axios'
import { BaseApiService } from '@nominal-systems/dmi-engine-common'

@Injectable()
export class WisdomPanelApiService extends BaseApiService {
  constructor(private readonly httpService: HttpService) {
    super(httpService)
  }
}

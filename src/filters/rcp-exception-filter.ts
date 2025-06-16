import { ArgumentsHost, Catch, ExceptionFilter, Logger } from '@nestjs/common'
import { RpcException } from '@nestjs/microservices'
import { Observable, of, throwError } from 'rxjs'
import { ProviderError } from '@nominal-systems/dmi-engine-common'
import { PROVIDER_NAME } from '../constants/provider-name'
import { WisdomApiException } from '../exceptions/wisdom-api.exception'

@Catch(RpcException)
export class RpcExceptionFilter implements ExceptionFilter<RpcException> {
  private readonly logger = new Logger(RpcExceptionFilter.name)

  catch(exception: WisdomApiException, host: ArgumentsHost): Observable<any> {
    this.logger.error(exception)

    const providerError: ProviderError = new ProviderError({
      provider: PROVIDER_NAME,
      code: exception.statusCode || 500,
      message: exception.message,
      error: exception.errors,
    })

    return throwError(() => providerError)
  }
}

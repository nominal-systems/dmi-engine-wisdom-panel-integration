import { Catch, ExceptionFilter } from '@nestjs/common'
import { RpcException } from '@nestjs/microservices'

@Catch(RpcException)
export class RpcExceptionFilter implements ExceptionFilter<RpcException> {
  catch (exception: RpcException) {
    // TODO(gb): handle the exception
    console.log(`RpcExceptionFilter exception= ${JSON.stringify(exception, null, 2)}`) // TODO(gb): remove trace
  }
}

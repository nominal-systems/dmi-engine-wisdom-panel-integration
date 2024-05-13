import { RpcException } from '@nestjs/microservices'

export class WisdomApiException extends RpcException {
  private _errors: string[] = []
  private _statusCode: number = 500

  constructor (message: string, statusCode: number, error: any) {
    super(message)
    this._statusCode = statusCode

    if (error._errors !== undefined) {
      this._errors = error._errors
    }

    if (error.options?.message !== undefined) {
      this._errors.unshift(error.options.message)
    }

    if (error.options?.errors !== undefined) {
      error.options.errors.forEach((err: any) => {
        this._errors.unshift(`${err.title}: ${err.detail}`)
      })
    }

    if (error.message !== undefined) {
      this._errors.unshift(error.message)
    }
  }

  public get statusCode (): number {
    return this._statusCode
  }

  public get errors (): string[] {
    return this._errors
  }
}

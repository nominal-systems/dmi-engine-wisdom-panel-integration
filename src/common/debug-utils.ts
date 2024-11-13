import { FileUtils } from '@nominal-systems/dmi-engine-common'
import * as process from 'node:process'
import * as path from 'node:path'
import { PROVIDER_NAME } from '../constants/provider-name'

export function debugApiEvent(eventName: string, data: any): void {
  const filename: string = path.join('debug', 'events', PROVIDER_NAME, `${new Date().getTime()}-${eventName}.json`)
  FileUtils.saveFile(filename, JSON.stringify(data, null, 2))
  console.log('===============================================================================')
  console.log(`EVENT: ${eventName}`)
  console.log(`Saved event to ${process.cwd()}/${filename}`)
  console.log('===============================================================================')
}

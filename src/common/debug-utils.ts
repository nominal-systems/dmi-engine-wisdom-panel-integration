import { CreateOrderPayload, Order, OrderStatus, Result } from '@nominal-systems/dmi-engine-common'
import { WisdomPanelPetCreatedResponse } from '../interfaces/wisdom-panel-api-responses.interface'

export function debugOrderCreated(payload: CreateOrderPayload, response: WisdomPanelPetCreatedResponse): void {
  const order = {
    externalId: response.data.kit.id,
    status: OrderStatus.SUBMITTED,
    ...payload
  }
  console.log('===============================================================================')
  console.log('EVENT: order:created')
  console.log('===============================================================================')
  console.log(`order= ${JSON.stringify(order, null, 2)}`)
  console.log('===============================================================================\n')
}

export function debugFetchedOrders(orders: Order[]): void {
  for (const order of orders) {
    console.log('===============================================================================')
    console.log('EVENT: order:update')
    console.log('===============================================================================')
    console.log(`order= ${JSON.stringify(order, null, 2)}`)
    console.log('===============================================================================\n')
  }
}

export function debugFetchedResults(results: Result[]): void {
  for (const result of results) {
    console.log('===============================================================================')
    console.log('EVENT: report:update')
    console.log('===============================================================================')
    console.log(`result= ${JSON.stringify(result, null, 2)}`)
    console.log('===============================================================================\n')
  }
}

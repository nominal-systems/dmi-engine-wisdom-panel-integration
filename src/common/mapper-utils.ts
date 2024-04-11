import {
  ClientPayload,
  Identifier,
  OrderPatient,
  OrderStatus,
  PimsIdentifiers,
  Test
} from '@nominal-systems/dmi-engine-common'

export function mapPetSpecies (species: string): 'dog' | 'cat' {
  switch (species) {
    case 'dog':
      return 'dog'
    case 'cat':
      return 'cat'
    default:
      return 'dog'
  }
}

export function mapPetSex (sex: string): 'male' | 'female' {
  switch (sex) {
    case 'male':
      return 'male'
    case 'females':
      return 'female'
    default:
      return 'male'
  }
}

export function mapKitStatus (status: string): OrderStatus {
  switch (status) {
    case 'shipped':
    case 'waiting':
      return OrderStatus.SUBMITTED
    case 'processing':
    case 'analyzing':
    case 'generating-report':
      return OrderStatus.PARTIAL
    case 'report-ready':
      return OrderStatus.COMPLETED
    default:
      return OrderStatus.SUBMITTED
  }
}

export function extractKitCode (tests: Test[]): string {
  return tests[0].code
}

export function extractPetId (patient: OrderPatient): string {
  if (patient.identifier !== undefined && patient.identifier !== null) {
    return extractValueFromIdentifier(patient.identifier, PimsIdentifiers.PatientID)
  } else {
    return patient.id
  }
}

export function extractClientPetId (client: ClientPayload): string {
  if (client.identifier !== undefined && client.identifier !== null) {
    return extractValueFromIdentifier(client.identifier, PimsIdentifiers.ClientID)
  } else {
    return client.id
  }
}

export function extractValueFromIdentifier (identifier: Identifier[], system: string): string {
  const id = identifier.find(idElement => idElement.system === system)
  return id ? id.value : ''
}

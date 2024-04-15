import {
  ClientPayload,
  Identifier,
  OrderPatient,
  OrderStatus,
  PimsIdentifiers,
  Test
} from '@nominal-systems/dmi-engine-common'
import {
  WisdomPanelBreedPercentagesResult,
  WisdomPanelIdealWeightResult,
  WisdomPanelTestResult
} from '../interfaces/wisdom-panel-api-responses.interface'

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

export function mapTestResultName (key: string): string {
  switch (key) {
    case 'breed_percentages':
      return 'Breed Percentages'
    case 'ideal_weight_result':
      return 'Ideal Weight Result'
    case 'notable_and_at_risk_health_test_results':
      return 'Notable and At Risk Health Test Results'
    default:
      return key
  }
}

export function mapTestResultItemValue (key: string, item: WisdomPanelTestResult): string {
  let valueString = ''
  switch (key) {
    case 'breed_percentages':
      const breedPercentages: string[] = []
      for (const breedPercentage of item as WisdomPanelBreedPercentagesResult[]) {
        breedPercentages.push(`${breedPercentage.percentage}% ${breedPercentage.breed.internal_name}`)
      }
      valueString = breedPercentages.join(', ')
      break
    case 'ideal_weight_result':
      const idealWeightResult = item as WisdomPanelIdealWeightResult
      valueString += `Ideal weight: ${idealWeightResult.male_min_size} - ${idealWeightResult.male_max_size} lbs`
      break
    case 'notable_and_at_risk_health_test_results':
    default:
      valueString = 'N/A'
  }

  return valueString
}

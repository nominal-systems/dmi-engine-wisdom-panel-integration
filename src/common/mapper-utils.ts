import {
  ClientPayload,
  Identifier,
  OrderPatient,
  OrderStatus,
  PimsIdentifiers,
  TestResultItem,
  TestResultItemStatus
} from '@nominal-systems/dmi-engine-common'
import {
  WisdomPanelBreedPercentagesResult,
  WisdomPanelIdealWeightResult,
  WisdomPanelNotableAndAtRiskHealthTestResult
} from '../interfaces/wisdom-panel-api-responses.interface'

export function mapPetSpecies(species: string): 'dog' | 'cat' {
  switch (species) {
    case 'dog':
      return 'dog'
    case 'cat':
      return 'cat'
    default:
      return 'dog'
  }
}

export function mapPetSex(sex: string): 'male' | 'female' {
  switch (sex) {
    case 'male':
      return 'male'
    case 'females':
      return 'female'
    default:
      return 'male'
  }
}

export function mapKitStatus(status: string): OrderStatus {
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

export function extractKitCode(labRequisitionInfo: any): string {
  return labRequisitionInfo.kitCode
}

export function extractPetId(patient: OrderPatient): string {
  if (patient.identifier !== undefined && patient.identifier !== null) {
    return extractValueFromIdentifier(patient.identifier, PimsIdentifiers.PatientID)
  } else {
    return patient.id
  }
}

export function extractClientPetId(client: ClientPayload): string {
  if (client.identifier !== undefined && client.identifier !== null) {
    return extractValueFromIdentifier(client.identifier, PimsIdentifiers.ClientID)
  } else {
    return client.id
  }
}

export function extractValueFromIdentifier(identifier: Identifier[], system: string): string {
  const id = identifier.find((idElement) => idElement.system === system)
  return id ? id.value : ''
}

export function mapTestResultName(key: string): string {
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

export function mapBreedPercentage(
  percentagesResults: WisdomPanelBreedPercentagesResult[],
  index: number
): TestResultItem[] {
  return percentagesResults.map((result: WisdomPanelBreedPercentagesResult, i) => {
    return {
      seq: i,
      code: result.breed.slug,
      name: result.breed.name.en,
      status: TestResultItemStatus.DONE,
      valueQuantity: {
        value: result.percentage,
        units: '%'
      },
      notes: `${result.percentage}% ${result.breed.name.en}`
    }
  })
}

export function mapIdealWeightResult(result: WisdomPanelIdealWeightResult, index: number): TestResultItem[] {
  // TODO(gb): should determine ideal weights by sex/sterility status
  return [
    {
      seq: 0,
      code: 'ideal_weight_result_male_min_size',
      name: 'Minimal Ideal Weight Result',
      status: TestResultItemStatus.DONE,
      valueQuantity: {
        value: result.male_min_size,
        units: 'kg'
      }
    },
    {
      seq: 1,
      code: 'ideal_weight_result_male_max_size',
      name: 'Maximum Ideal Weight Result',
      status: TestResultItemStatus.DONE,
      valueQuantity: {
        value: result.male_max_size,
        units: 'kg'
      }
    },
    {
      seq: 2,
      code: 'ideal_weight_result_male_pred_size',
      name: 'Predicted Ideal Weight Result',
      status: TestResultItemStatus.DONE,
      valueQuantity: {
        value: result.male_pred_size,
        units: 'kg'
      }
    }
  ]
}

export function mapNotableAndAtRiskHealthTestResults(
  notableAndAtRiskHealthTestResults: WisdomPanelNotableAndAtRiskHealthTestResult[],
  index: number
): TestResultItem[] {
  const items: TestResultItem[] = []
  notableAndAtRiskHealthTestResults.forEach((result: WisdomPanelNotableAndAtRiskHealthTestResult, i) => {
    items.push({
      seq: i * 2,
      code: result.health_test.slug,
      name: result.health_test.disease_name.en,
      status: TestResultItemStatus.DONE,
      // TODO(gb): should determine result by sex/sterility status
      valueString: result.result_male
    })
    items.push({
      seq: i * 2 + 1,
      code: `${result.health_test.slug}_copies`,
      name: `${result.health_test.disease_name.en} Copies`,
      status: TestResultItemStatus.DONE,
      valueQuantity: {
        value: result.copies,
        units: ''
      },
      // TODO(gb): should determine copy by sex/sterility status
      notes: result.health_test[`${'zero'}_copy_male`].en
    })
  })

  return items
}

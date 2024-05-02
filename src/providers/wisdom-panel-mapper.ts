import { Injectable } from '@nestjs/common'
import {
  ClientPayload,
  CreateOrderPayload,
  Order,
  OrderPatient,
  Patient,
  Result,
  ResultStatus,
  TestResult,
  TestResultItem,
  Veterinarian,
  VeterinarianPayload
} from '@nominal-systems/dmi-engine-common'
import { WisdomPanelMessageData } from '../interfaces/wisdom-panel-message-data.interface'
import { WisdomPanelCreatePetPayload } from '../interfaces/wisdom-panel-api-payloads.interface'
import {
  extractClientPetId,
  extractKitCode,
  extractPetId,
  mapBreedPercentage,
  mapIdealWeightResult,
  mapKitStatus,
  mapNotableAndAtRiskHealthTestResults,
  mapPetSex,
  mapPetSpecies,
  mapTestResultName
} from '../common/mapper-utils'
import {
  WisdomPanelClient,
  WisdomPanelHospital,
  WisdomPanelPet,
  WisdomPanelVeterinarian
} from '../interfaces/wisdom-panel-entities.interface'
import {
  WisdomPanelBreedPercentagesResult,
  WisdomPanelIdealWeightResult,
  WisdomPanelKitItem,
  WisdomPanelNotableAndAtRiskHealthTestResult,
  WisdomPanelPetItem,
  WisdomPanelResultSetItem,
  WisdomPanelSimpleResult,
  WisdomPanelStatusesItem,
  WisdomPanelTestResult
} from '../interfaces/wisdom-panel-api-responses.interface'
import { Client } from '@nominal-systems/dmi-engine-common/lib/interfaces/provider-service'

@Injectable()
export class WisdomPanelMapper {
  constructor () {}

  mapCreateOrderPayload (payload: CreateOrderPayload, metadata: WisdomPanelMessageData): WisdomPanelCreatePetPayload {
    return {
      data: {
        organization_unit_id: metadata.providerConfiguration.organizationUnitId,
        code: extractKitCode(payload.tests),
        ...this.extractPet(payload.patient),
        ...this.extractClient(payload.client),
        ...this.extractHospital(metadata),
        ...this.extractVeterinarian(payload.veterinarian)
      }
    }
  }

  mapWisdomPanelKit (kit: WisdomPanelKitItem, pet: WisdomPanelPetItem, kitStatus?: WisdomPanelStatusesItem): Order {
    return {
      externalId: kit.id,
      status: mapKitStatus(kit.attributes['current-stage']),
      patient: this.mapPatient(pet),
      client: this.mapClient(pet),
      tests: [{ code: kit.attributes.code }],
      veterinarian: this.mapVeterinarian(kit)
    }
  }

  mapWisdomPanelResult (
    resultSet: WisdomPanelResultSetItem,
    kit: WisdomPanelKitItem,
    simpleResult: WisdomPanelSimpleResult
  ): Result {
    return {
      id: resultSet.id,
      orderId: kit.id,
      // order?: Order;
      // accession?: string;
      status: ResultStatus.COMPLETED,
      testResults: this.extractTestResults(simpleResult)
    }
  }

  extractTestResults (simpleResult: WisdomPanelSimpleResult): TestResult[] {
    const testResults: Record<string, WisdomPanelTestResult>[] = []
    Object.keys(simpleResult).forEach((key) => {
      if (!(key === 'notable_and_at_risk_health_test_results' && simpleResult[key].length === 0)) {
        testResults.push({
          [key]: simpleResult[key]
        })
      }
    })

    return testResults.map(this.mapWisdomPanelTestResult, this)
  }

  mapWisdomPanelTestResult (result: Record<string, WisdomPanelTestResult>, index: number): TestResult {
    const key = Object.keys(result)[0]
    return {
      seq: index,
      code: key,
      name: mapTestResultName(key),
      items: this.mapWisdomPanelTestResultItems(result[key], key, index)
    }
  }

  mapWisdomPanelTestResultItems (item: WisdomPanelTestResult, key: string, index: number): TestResultItem[] {
    switch (key) {
      case 'breed_percentages':
        return mapBreedPercentage(item as WisdomPanelBreedPercentagesResult[], index)
      case 'ideal_weight_result':
        return mapIdealWeightResult(item as WisdomPanelIdealWeightResult, index)
      case 'notable_and_at_risk_health_test_results':
        return mapNotableAndAtRiskHealthTestResults(item as WisdomPanelNotableAndAtRiskHealthTestResult[], index)
      default:
        return []
    }
  }

  mapPatient (pet: WisdomPanelPetItem): Patient {
    return {
      name: pet.attributes.name,
      // TODO(gb): map sex
      sex: pet.attributes.sex,
      // TODO(gb): map species
      species: pet.attributes.species
    }
  }

  mapClient (pet: WisdomPanelPetItem): Client {
    return {
      firstName: pet.attributes['owner-first-name'],
      lastName: pet.attributes['owner-last-name']
    }
  }

  mapVeterinarian (kit: WisdomPanelKitItem): Veterinarian {
    return {
      firstName: kit.attributes['veterinarian-name']
    }
  }

  extractPet (patient: OrderPatient): Omit<WisdomPanelPet, 'id'> {
    const pet: Omit<WisdomPanelPet, 'id'> = {
      species: mapPetSpecies(patient.species),
      name: patient.name,
      sex: mapPetSex(patient.sex),
      intact: true,
      voyager_pet_id: extractPetId(patient)
    }

    if (patient.birthdate !== undefined) {
      pet.birth_day = patient.birthdate.split('-')[2]
      pet.birth_month = patient.birthdate.split('-')[1]
      pet.birth_year = patient.birthdate.split('-')[0]
    }
    return pet
  }

  extractClient (client: ClientPayload): WisdomPanelClient {
    return {
      client_first_name: client.firstName || '',
      client_last_name: client.lastName,
      client_pet_id: extractClientPetId(client)
      // TODO(gb): extract client contact/address
    }
  }

  extractHospital (metadata: WisdomPanelMessageData): WisdomPanelHospital {
    const hospital: WisdomPanelHospital = {
      hospital_name: metadata.integrationOptions.hospitalName,
      hospital_number: metadata.integrationOptions.hospitalNumber
    }

    if (metadata.integrationOptions.hospitalPhone !== undefined) {
      hospital.hospital_phone_number = metadata.integrationOptions.hospitalPhone
    }

    return hospital
  }

  extractVeterinarian (veterinarian: VeterinarianPayload): WisdomPanelVeterinarian {
    return {
      veterinarian_name: `${veterinarian.firstName} ${veterinarian.lastName}`
    }
  }
}

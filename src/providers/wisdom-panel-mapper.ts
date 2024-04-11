import { Injectable } from '@nestjs/common'
import {
  ClientPayload,
  CreateOrderPayload,
  Order,
  OrderPatient,
  OrderStatus,
  Patient,
  Result,
  Veterinarian,
  VeterinarianPayload
} from '@nominal-systems/dmi-engine-common'
import { WisdomPanelMessageData } from '../interfaces/wisdom-panel-message-data.interface'
import { WisdomPanelCreatePetPayload, } from '../interfaces/wisdom-panel-api-payloads.interface'
import { extractClientPetId, extractKitCode, extractPetId, mapPetSex, mapPetSpecies } from '../common/mapper-utils'
import {
  WisdomPanelClient,
  WisdomPanelHospital,
  WisdomPanelPet,
  WisdomPanelVeterinarian
} from '../interfaces/wisdom-panel-entities.interface'
import {
  WisdomPanelKitItem,
  WisdomPanelPetItem,
  WisdomPanelSimpleResult
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

  mapWisdomPanelKit (kit: WisdomPanelKitItem, pet: WisdomPanelPetItem): Order {
    return {
      externalId: kit.id,
      // TODO(gb): map status
      status: OrderStatus.SUBMITTED,
      patient: this.mapPatient(pet),
      client: this.mapClient(pet),
      tests: [
        { code: kit.attributes.code }
      ],
      veterinarian: this.mapVeterinarian(kit)
    }
  }

  mapWisdomPanelSimpleResult (simpleResult: WisdomPanelSimpleResult): Result {
    // TODO(gb): map result
    return {} as unknown as Result
  }

  extractPet (patient: OrderPatient): Omit<WisdomPanelPet, 'id'> {
    const pet: Omit<WisdomPanelPet, 'id'> = {
      species: mapPetSpecies(patient.species),
      name: patient.name,
      sex: mapPetSex(patient.sex),
      intact: true,
      voyager_pet_id: extractPetId(patient),
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
      client_pet_id: extractClientPetId(client),
      // TODO(gb): extract client contact/address
    }
  }

  extractHospital (metadata: WisdomPanelMessageData): WisdomPanelHospital {
    const hospital: WisdomPanelHospital = {
      hospital_name: metadata.integrationOptions.hospitalName,
      hospital_number: metadata.integrationOptions.hospitalNumber,
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

  mapPatient (pet: WisdomPanelPetItem): Patient {
    return {
      name: pet.attributes.name,
      // TODO(gb): map sex
      sex: pet.attributes.sex,
      // TODO(gb): map species
      species: pet.attributes.species,
    }
  }

  mapClient (pet: WisdomPanelPetItem): Client {
    return {
      firstName: pet.attributes['owner-first-name'],
      lastName: pet.attributes['owner-last-name'],
    }
  }

  mapVeterinarian (kit: WisdomPanelKitItem): Veterinarian {
    return {
      firstName: kit.attributes['veterinarian-name']
    }
  }
}

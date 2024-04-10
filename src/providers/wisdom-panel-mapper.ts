import { Injectable } from '@nestjs/common'
import {
  ClientPayload,
  CreateOrderPayload,
  OrderPatient,
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
}

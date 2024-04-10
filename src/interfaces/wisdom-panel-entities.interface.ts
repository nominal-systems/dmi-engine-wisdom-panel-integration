export interface WisdomPanelPet {
  id: string
  species: 'dog' | 'cat'
  name: string
  sex: 'male' | 'female'
  intact: boolean
  voyager_pet_id: string
  birth_day?: string
  birth_month?: string
  birth_year?: string
  nickname?: string
  story?: string
}

export interface WisdomPanelClient {
  client_first_name: string
  client_last_name: string
  client_pet_id: string
  client_email?: string
  client_phone?: string
  client_address_1?: string
  client_address_2?: string
  client_city?: string
  client_state?: string
  client_zip?: string
}

export interface WisdomPanelVeterinarian {
  veterinarian_name: string
}

export interface WisdomPanelHospital {
  hospital_name: string
  hospital_number: string
  hospital_phone_number?: string
  hospital_street?: string
  hospital_city?: string
  hospital_state?: string
  hospital_postal_code?: string
  hospital_country?: string
}

export interface WisdomPanelKit {
  id: string
}

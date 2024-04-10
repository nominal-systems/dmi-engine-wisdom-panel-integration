import { WisdomPanelMapper } from './wisdom-panel-mapper'
import { CreateOrderPayload } from '@nominal-systems/dmi-engine-common'

describe('WisdomPanelMapper', () => {
  let mapper: WisdomPanelMapper
  const metadataMock = {
    integrationOptions: {
      hospitalName: 'Test Hospital',
      hospitalNumber: '123',
      hospitalPhone: '555-5555'
    },
    providerConfiguration: {
      baseUrl: 'https://staging.wisdompanel.com',
      username: 'gonzalo@linehq.com',
      password: 'password',
      organizationUnitId: '{{organizationUnitId}}'
    }
  }

  beforeAll(() => {
    mapper = new WisdomPanelMapper()
  })

  describe('mapCreateOrderPayload()', () => {
    it('should map to the create pet payload', () => {
      expect(mapper.mapCreateOrderPayload({
        patient: {
          id: 'aa8093d3-0447-4022-8d73-4608178e46d4',
          name: 'Miso',
          identifier: [
            {
              system: 'pims:patient:id',
              value: '434956978',
            }
          ],
          sex: 'male',
          species: 'dog',
          birthdate: '2023-04-24'
        },
        client: {
          id: '3da0246d-be43-4ea8-965d-597e3a93d98b',
          lastName: 'Bellver',
          firstName: 'Gonzalo',
          identifier: [
            {
              system: 'pims:client:id',
              value: 'UAT2JWU',
            }
          ],
        },
        veterinarian: {
          id: '1e9f3603-013b-4cdd-aa07-f3a4fd11eaf2',
          lastName: 'Foo',
          firstName: 'Dr.',
          identifier: [
            {
              system: 'pims:veterinarian:id',
              value: '9999',
            }
          ]
        },
        tests: [
          {
            code: 'SA804'
          }
        ],
        editable: false,
      } as unknown as CreateOrderPayload, metadataMock)).toEqual({
        data: {
          organization_unit_id: '{{organizationUnitId}}',
          code: 'SA804',
          species: 'dog',
          name: 'Miso',
          sex: 'male',
          intact: true,
          client_first_name: 'Gonzalo',
          client_last_name: 'Bellver',
          veterinarian_name: 'Dr. Foo',
          voyager_pet_id: '434956978',
          client_pet_id: 'UAT2JWU',
          hospital_name: metadataMock.integrationOptions.hospitalName,
          hospital_number: metadataMock.integrationOptions.hospitalNumber,
          hospital_phone_number: metadataMock.integrationOptions.hospitalPhone,
          birth_day: '24',
          birth_month: '04',
          birth_year: '2023'
        }
      })
    })
  })
})

import { WisdomPanelMapper } from './wisdom-panel-mapper'
import {
  CreateOrderPayload,
  FileUtils,
  OrderStatus,
  ResultStatus,
  TestResult,
  TestResultItemStatus
} from '@nominal-systems/dmi-engine-common'
import {
  WisdomPanelKitItem,
  WisdomPanelPetItem,
  WisdomPanelResultSetItem,
  WisdomPanelSimpleResult,
  WisdomPanelSimpleResultResponse,
  WisdomPanelTestResult
} from '../interfaces/wisdom-panel-api-responses.interface'

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
      password: 'evEk3eyJ',
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

  describe('mapWisdomPanelKit()', () => {
    it('should map a kit to an order', () => {
      const kit: WisdomPanelKitItem = {
        'id': '1cdf3f85-e3e0-4795-b582-a716fac2ad4c',
        'type': 'kits',
        'links': {
          'self': 'https://staging.wisdompanel.com/api/v1/kits/1cdf3f85-e3e0-4795-b582-a716fac2ad4c'
        },
        'attributes': {
          'code': 'VSMQCZR',
          'active': true,
          'enabled': true,
          'activated': true,
          'current-stage': 'shipped',
          'organization-identity': 'BANFIELD-VOYAGER-VSMQCZR',
          'veterinarian-name': 'Dr. Foo',
          'hospital-name': 'Test Hospital',
          'hospital-number': '123',
          'created-at': '2024-02-27T17:41:56.028Z'
        },
        'relationships': {}
      }
      const pet: WisdomPanelPetItem = {
        'id': '8b85c33e-d689-4534-99e8-b4071c170a7f',
        'type': 'pets',
        'links': {
          'self': 'https://staging.wisdompanel.com/api/v1/pets/8b85c33e-d689-4534-99e8-b4071c170a7f'
        },
        'attributes': {
          'name': 'Miso',
          'sex': 'male',
          'species': 'dog',
          'intact': true,
          'organization-identity': 'BANFIELD-VOYAGER-VYJKWVD',
          'owner-first-name': 'Gonzalo',
          'owner-last-name': 'Bellver',
          'created-at': '2024-04-10T00:51:05.994Z',
        },
        'relationships': {}
      }
      expect(mapper.mapWisdomPanelKit(kit, pet)).toEqual({
        externalId: '1cdf3f85-e3e0-4795-b582-a716fac2ad4c',
        status: OrderStatus.SUBMITTED,
        patient: {
          name: 'Miso',
          sex: 'male',
          species: 'dog'
        },
        client: {
          firstName: 'Gonzalo',
          lastName: 'Bellver'
        },
        tests: [
          { code: 'VSMQCZR' }
        ],
        veterinarian: {
          firstName: 'Dr. Foo'
        }
      })
    })
  })

  describe('mapWisdomPanelResult()', () => {
    it('should map a Wisdom Panel result set to a DMI result', () => {
      expect(mapper.mapWisdomPanelResult(
        {
          id: 'result-set-id',
        } as unknown as WisdomPanelResultSetItem,
        {
          id: 'kit-id'
        } as unknown as WisdomPanelKitItem,
        {} as unknown as WisdomPanelSimpleResult
      )).toEqual({
        id: 'result-set-id',
        orderId: 'kit-id',
        status: ResultStatus.COMPLETED,
        testResults: expect.any(Array)
      })
    })
  })

  describe('extractTestResults()', () => {
    const simpleResultResponse = FileUtils.loadFile('test/examples/simplified-result_01.json') as WisdomPanelSimpleResultResponse
    it('should extract test results from a simplified result', () => {
      const testResults: TestResult[] = mapper.extractTestResults(simpleResultResponse.data)
      expect(testResults).toEqual(expect.any(Array))
      expect(testResults.length).toEqual(3)
      expect(testResults[0]).toEqual({
        seq: 0,
        code: 'breed_percentages',
        name: 'Breed Percentages',
        items: expect.any(Array)
      })
      expect(testResults[1]).toEqual({
        seq: 1,
        code: 'ideal_weight_result',
        name: 'Ideal Weight Result',
        items: expect.any(Array)
      })
      expect(testResults[2]).toEqual({
        seq: 2,
        code: 'notable_and_at_risk_health_test_results',
        name: 'Notable and At Risk Health Test Results',
        items: expect.any(Array)
      })
    })
  })

  describe('mapWisdomPanelTestResultItem()', () => {
    const simpleResultResponse = FileUtils.loadFile('test/examples/simplified-result_01.json') as WisdomPanelSimpleResultResponse

    it('should map breed percentages results', () => {
      expect(mapper.mapWisdomPanelTestResultItem(simpleResultResponse.data.breed_percentages as WisdomPanelTestResult, 'breed_percentages', 0)).toEqual({
        seq: 0,
        code: 'breed_percentages',
        name: 'Breed Percentages',
        status: TestResultItemStatus.DONE,
        valueString: '48% Boxer, 31% Bulldog (Standard), 14% Bulldog (American), 4% Staffordshire Bull Terrier, 2% Mastiff, 1% American Pit Bull Terrier',
      })
    })

    it('should map ideal weight results', () => {
      expect(mapper.mapWisdomPanelTestResultItem(simpleResultResponse.data.ideal_weight_result as WisdomPanelTestResult, 'ideal_weight_result', 0)).toEqual({
        seq: 0,
        code: 'ideal_weight_result',
        name: 'Ideal Weight Result',
        status: TestResultItemStatus.DONE,
        valueString: 'Ideal weight: 22.2 - 37.2 lbs',
      })
    })

    it('should map notable and at risk health test results', () => {
      expect(mapper.mapWisdomPanelTestResultItem(simpleResultResponse.data.notable_and_at_risk_health_test_results as WisdomPanelTestResult, 'notable_and_at_risk_health_test_results', 0)).toEqual({
        seq: 0,
        code: 'notable_and_at_risk_health_test_results',
        name: 'Notable and At Risk Health Test Results',
        status: TestResultItemStatus.DONE,
        valueString: 'N/A',
      })
    })
  })

})

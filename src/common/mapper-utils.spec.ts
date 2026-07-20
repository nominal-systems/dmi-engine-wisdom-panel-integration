import {
  extractKitCode,
  mapNotableAndAtRiskHealthTestResults,
  petMatchesCreatePetPayload,
} from './mapper-utils'
import { WisdomPanelCreatePetPayload } from '../interfaces/wisdom-panel-api-payloads.interface'
import { WisdomPanelPetItem } from '../interfaces/wisdom-panel-api-responses.interface'

describe('mapper-utils', () => {
  describe('extractKitCode()', () => {
    it('should capitalize and trim the kit code', () => {
      expect(extractKitCode({ KitCode: ' 1234 ' })).toBe('1234')
      expect(extractKitCode({ KitCode: 'v-ss123 ' })).toBe('V-SS123')
      expect(extractKitCode({ KitCode: ' v-abc3' })).toBe('V-ABC3')
      expect(extractKitCode({ KitCode: 'v abaDDC ' })).toBe('V ABADDC')
    })
  })
  describe('mapNotableAndAtRiskHealthTestResults()', () => {
    it('should use result_value when available', () => {
      const results = [
        {
          copies: 2,
          result_value: 'TEST_VALUE',
          resolved_result: 'RESOLVED_RESULT',
          ui_description: 'test description',
          health_test: {
            slug: 'test-slug',
            disease_name: {
              en: 'Test Disease',
            },
          },
        },
      ]

      const items = mapNotableAndAtRiskHealthTestResults(results, 0)
      expect(items[0].valueString).toBe('TEST_VALUE')
    })

    it('should fallback to resolved_result when result_value is not available', () => {
      const results = [
        {
          copies: 2,
          resolved_result: 'RESOLVED_RESULT',
          ui_description: 'test description',
          health_test: {
            slug: 'test-slug',
            disease_name: {
              en: 'Test Disease',
            },
          },
        },
      ]

      const items = mapNotableAndAtRiskHealthTestResults(results, 0)
      expect(items[0].valueString).toBe('RESOLVED_RESULT')
    })
  })
  describe('petMatchesCreatePetPayload()', () => {
    const payload = {
      data: {
        name: 'Firulais',
        species: 'dog',
        client_last_name: 'Greco',
      },
    } as WisdomPanelCreatePetPayload

    const buildPet = (attributes: Record<string, unknown>): WisdomPanelPetItem =>
      ({
        id: 'pet-id-1',
        type: 'pets',
        attributes,
      }) as unknown as WisdomPanelPetItem

    it('should match on normalized name and species', () => {
      const pet = buildPet({ name: '  firulais ', species: 'dog', 'owner-last-name': 'Greco' })
      expect(petMatchesCreatePetPayload(pet, payload)).toBe(true)
    })

    it('should not match a different pet name', () => {
      const pet = buildPet({ name: 'Rex', species: 'dog', 'owner-last-name': 'Greco' })
      expect(petMatchesCreatePetPayload(pet, payload)).toBe(false)
    })

    it('should not match a different species', () => {
      const pet = buildPet({ name: 'Firulais', species: 'cat', 'owner-last-name': 'Greco' })
      expect(petMatchesCreatePetPayload(pet, payload)).toBe(false)
    })

    it('should not match when the owner last name differs', () => {
      const pet = buildPet({ name: 'Firulais', species: 'dog', 'owner-last-name': 'Smith' })
      expect(petMatchesCreatePetPayload(pet, payload)).toBe(false)
    })

    it('should match when the owner last name is missing on either side', () => {
      const noOwner = buildPet({ name: 'Firulais', species: 'dog' })
      expect(petMatchesCreatePetPayload(noOwner, payload)).toBe(true)

      const payloadNoLastName = {
        data: { name: 'Firulais', species: 'dog', client_last_name: '' },
      } as WisdomPanelCreatePetPayload
      const withOwner = buildPet({ name: 'Firulais', species: 'dog', 'owner-last-name': 'Greco' })
      expect(petMatchesCreatePetPayload(withOwner, payloadNoLastName)).toBe(true)
    })
  })
})

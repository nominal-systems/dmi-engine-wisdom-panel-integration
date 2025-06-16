import { extractKitCode, mapNotableAndAtRiskHealthTestResults } from './mapper-utils'

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
})

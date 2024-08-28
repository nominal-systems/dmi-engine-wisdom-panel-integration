import { extractKitCode } from './mapper-utils'

describe('mapper-utils', () => {
  describe('extractKitCode()', () => {
    it('should capitalize and trim the kit code', () => {
        expect(extractKitCode({ KitCode: ' 1234 ' })).toBe('1234')
        expect(extractKitCode({ KitCode: 'v-ss123 ' })).toBe('V-SS123')
        expect(extractKitCode({ KitCode: ' v-abc3' })).toBe('V-ABC3')
        expect(extractKitCode({ KitCode: 'v abaDDC ' })).toBe('V ABADDC')
    })
  })
})

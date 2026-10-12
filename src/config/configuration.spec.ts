import configuration from './configuration'

describe('configuration', () => {
  describe('processors.results.stuckKitHours', () => {
    const original = process.env.WISDOM_PANEL_STUCK_KIT_HOURS

    afterEach(() => {
      if (original === undefined) {
        delete process.env.WISDOM_PANEL_STUCK_KIT_HOURS
      } else {
        process.env.WISDOM_PANEL_STUCK_KIT_HOURS = original
      }
    })

    it('should default to 36 hours when the variable is not set', () => {
      delete process.env.WISDOM_PANEL_STUCK_KIT_HOURS
      expect(configuration().processors.results.stuckKitHours).toBe(36)
    })

    it.each(['48', '1.5'])('should read %p as a number of hours', (value) => {
      process.env.WISDOM_PANEL_STUCK_KIT_HOURS = value
      expect(configuration().processors.results.stuckKitHours).toBe(Number(value))
    })

    it.each(['', ' ', '36h', 'abc', '0', '-12', 'Infinity'])(
      'should fall back to 36 hours for %p',
      (value) => {
        process.env.WISDOM_PANEL_STUCK_KIT_HOURS = value
        expect(configuration().processors.results.stuckKitHours).toBe(36)
      },
    )
  })
})

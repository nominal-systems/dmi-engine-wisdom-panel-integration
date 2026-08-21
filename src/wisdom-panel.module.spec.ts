import { Provider } from '@nestjs/common'
import { WisdomPanelModule } from './wisdom-panel.module'
import { FEATURE_FLAG_PROVIDER } from './feature-flags/feature-flag.interface'

describe('WisdomPanelModule.register()', () => {
  it('should not register a feature-flag provider by default', () => {
    const module = WisdomPanelModule.register()

    expect(module.providers).toEqual([])
  })

  it('should register the feature-flag provider supplied by the host', () => {
    const featureFlagProvider: Provider = {
      provide: FEATURE_FLAG_PROVIDER,
      useValue: { isEnabled: () => true },
    }

    const module = WisdomPanelModule.register({ featureFlagProvider })

    expect(module.providers).toEqual([featureFlagProvider])
  })

  it('should forward imports and extra providers', () => {
    const extraProvider: Provider = { provide: 'TOKEN', useValue: 'value' }

    const module = WisdomPanelModule.register({ providers: [extraProvider] })

    expect(module.providers).toEqual([extraProvider])
    expect(module.imports).toEqual([])
  })
})

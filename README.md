# dmi-engine-wisdom-panel-integration

DMI Engine integration NestJS Module for Wisdom Panel

## Development

To use this module in another project while developing, [yalc](https://github.com/wclr/yalc) can be used.

From the root of this project run:

````bash
npm run dev
````
This will publish `@nominal-systems/dmi-engine-wisdom-panel-integration` in the yalc store, watch for changes and build/publish on change.

To use it from another project, run:

````bash
yalc add @nominal-systems/dmi-engine-wisdom-panel-integration
````

## Feature flags

Some behaviour in this module is gated behind feature flags. The module does **not** ship a
feature-flag provider of its own — the host application injects one through
`WisdomPanelModule.register()`:

```ts
WisdomPanelModule.register({
  featureFlagProvider: myFeatureFlagProvider, // provides FEATURE_FLAG_PROVIDER
})
```

If no provider is supplied every flag evaluates to `false` and the gated code paths stay off.
This is deliberate: a provider declared here would shadow the one the host already exposes and
boot a second Statsig SDK instance.

### Available flags

| Flag | Default | Description |
| --- | --- | --- |
| `dmi_wisdom_panel_activated_kit_recovery` | off | When the Wisdom Panel API rejects an order with `422` because the kit is already activated, look the kit up and recover the order if the existing activation matches the pet being submitted. If it belongs to a different pet, or no activated kit is found, the `422` is propagated as before. |

Flags are evaluated with `clinicId` (the integration's `hospitalNumber`) and `integrationId`, so
rules can target a specific clinic.

### Providers

- **`StatsigFeatureFlagProvider`** — resolves flags against Statsig. Inside the DMI Engine the host
  supplies its own Statsig-backed provider, so this one is only needed when running this module
  standalone.
- **`EnvFeatureFlagProvider`** — resolves flags from environment variables. Intended for local
  development.

| Variable | Applies to | Description |
| --- | --- | --- |
| `WISDOM_PANEL_ACTIVATED_KIT_RECOVERY` | `EnvFeatureFlagProvider` only | Set to `true` to enable the flag above. Has no effect when the host injects a different provider — which is the case in the DMI Engine, where the flag is controlled from Statsig. |

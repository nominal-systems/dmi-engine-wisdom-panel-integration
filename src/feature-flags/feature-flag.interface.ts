export const FEATURE_FLAG_PROVIDER = 'FEATURE_FLAG_PROVIDER'

export interface FeatureFlagContext {
  userID?: string
  clinicId?: string
  integrationId?: string
  custom?: Record<string, unknown>
}

export interface FeatureFlagProvider {
  isEnabled(flag: string, context?: FeatureFlagContext): boolean
}

export const WISDOM_PANEL_ACTIVATED_KIT_RECOVERY = 'dmi_wisdom_panel_activated_kit_recovery'

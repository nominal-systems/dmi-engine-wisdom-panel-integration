import { Injectable } from '@nestjs/common'
import {
  WISDOM_PANEL_ACTIVATED_KIT_RECOVERY,
  type FeatureFlagContext,
  type FeatureFlagProvider,
} from './feature-flag.interface'

@Injectable()
export class EnvFeatureFlagProvider implements FeatureFlagProvider {
  isEnabled(flag: string, _context?: FeatureFlagContext): boolean {
    switch (flag) {
      case WISDOM_PANEL_ACTIVATED_KIT_RECOVERY:
        return process.env.WISDOM_PANEL_ACTIVATED_KIT_RECOVERY === 'true'
      default:
        return false
    }
  }
}

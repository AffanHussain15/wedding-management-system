/** Cross-platform elevation presets (iOS shadow / Android elevation). */

import { Platform, type ViewStyle } from 'react-native';

const make = (elevation: number, opacity: number, blur: number, offsetY: number): ViewStyle =>
  Platform.select<ViewStyle>({
    ios: {
      shadowColor: '#4A0A1C',
      shadowOpacity: opacity,
      shadowRadius: blur,
      shadowOffset: { width: 0, height: offsetY },
    },
    android: { elevation },
    default: {},
  }) as ViewStyle;

export const shadows = {
  none: {} as ViewStyle,
  sm: make(2, 0.06, 6, 2),
  md: make(4, 0.08, 12, 4),
  lg: make(8, 0.12, 24, 8),
} as const;

export type Shadows = typeof shadows;

export default shadows;

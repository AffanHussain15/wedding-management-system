/** Multi-segment donut chart (SVG). Renders center content via children. */

import React, { type PropsWithChildren } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

export interface DonutSegment {
  value: number;
  color: string;
}

export interface DonutChartProps extends PropsWithChildren {
  segments: DonutSegment[];
  size?: number;
  strokeWidth?: number;
  trackColor?: string;
}

export function DonutChart({
  segments,
  size = 84,
  strokeWidth = 14,
  trackColor = 'rgba(109,15,43,0.08)',
  children,
}: DonutChartProps): React.JSX.Element {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;
  const total = segments.reduce((sum, s) => sum + Math.max(0, s.value), 0);

  let offset = 0;

  return (
    <View style={[styles.wrap, { width: size, height: size }]}>
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke={trackColor}
          strokeWidth={strokeWidth}
          fill="none"
        />
        {total > 0 &&
          segments.map((s, i) => {
            const dash = (Math.max(0, s.value) / total) * circumference;
            const el = (
              <Circle
                key={i}
                cx={center}
                cy={center}
                r={radius}
                stroke={s.color}
                strokeWidth={strokeWidth}
                fill="none"
                strokeDasharray={`${dash} ${circumference - dash}`}
                strokeDashoffset={-offset}
                transform={`rotate(-90 ${center} ${center})`}
              />
            );
            offset += dash;
            return el;
          })}
      </Svg>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center' },
});

import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing } from 'react-native';
import Svg, { Circle, G, Path, Defs, LinearGradient as SvgLinearGradient, Stop, Polygon, Line } from 'react-native-svg';

interface IslamicGeometricPatternProps {
  size?: number;
  primaryColor?: string;
  secondaryColor?: string;
  opacity?: number;
  animated?: boolean;
}

export function IslamicGeometricPattern({
  size = 400,
  primaryColor = '#D4AF37',
  secondaryColor = '#ffffff',
  opacity = 0.15,
  animated = true,
}: IslamicGeometricPatternProps) {
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!animated) return;

    // Slow rotation
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 180000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    // Subtle pulse
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 4000,
          easing: Easing.inOut(Easing.sine),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 4000,
          easing: Easing.inOut(Easing.sine),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [animated]);

  const rotation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  // 8-pointed star path (Rub el Hizb - Islamic Star)
  const createStar8 = (cx: number, cy: number, outerR: number, innerR: number) => {
    const points = [];
    for (let i = 0; i < 16; i++) {
      const angle = (i * Math.PI) / 8 - Math.PI / 2;
      const r = i % 2 === 0 ? outerR : innerR;
      points.push(`${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`);
    }
    return `M ${points.join(' L ')} Z`;
  };

  // 6-pointed star (Seal of Solomon)
  const createStar6 = (cx: number, cy: number, r: number) => {
    const points1 = [];
    const points2 = [];
    for (let i = 0; i < 3; i++) {
      const angle1 = (i * 2 * Math.PI) / 3 - Math.PI / 2;
      points1.push(`${cx + r * Math.cos(angle1)},${cy + r * Math.sin(angle1)}`);
      const angle2 = angle1 + Math.PI / 3;
      points2.push(`${cx + r * Math.cos(angle2)},${cy + r * Math.sin(angle2)}`);
    }
    return [
      `M ${points1.join(' L ')} Z`,
      `M ${points2.join(' L ')} Z`,
    ];
  };

  const AnimatedG = Animated.createAnimatedComponent(G);

  return (
    <Animated.View
      style={[
        {
          width: size,
          height: size,
          transform: [{ rotate: animated ? rotation : '0deg' }, { scale: pulseAnim }],
        },
      ]}
    >
      <Svg width={size} height={size} viewBox="0 0 400 400">
        <Defs>
          <SvgLinearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor={primaryColor} stopOpacity={opacity} />
            <Stop offset="50%" stopColor="#FFD700" stopOpacity={opacity * 0.8} />
            <Stop offset="100%" stopColor={primaryColor} stopOpacity={opacity} />
          </SvgLinearGradient>
        </Defs>

        {/* Outer decorative circles */}
        <Circle cx="200" cy="200" r="195" fill="none" stroke={primaryColor} strokeWidth="1" opacity={opacity * 0.5} />
        <Circle cx="200" cy="200" r="190" fill="none" stroke={primaryColor} strokeWidth="0.5" opacity={opacity * 0.3} />
        <Circle cx="200" cy="200" r="185" fill="none" stroke={primaryColor} strokeWidth="1.5" opacity={opacity * 0.6} />

        {/* Decorative dots on outer circle */}
        {[...Array(24)].map((_, i) => {
          const angle = (i * Math.PI * 2) / 24;
          const x = 200 + 192 * Math.cos(angle);
          const y = 200 + 192 * Math.sin(angle);
          return (
            <Circle key={`dot-${i}`} cx={x} cy={y} r="2.5" fill={primaryColor} opacity={opacity * 0.8} />
          );
        })}

        {/* Main 8-pointed star in center */}
        <Path d={createStar8(200, 200, 80, 40)} fill="url(#goldGrad)" stroke={primaryColor} strokeWidth="1" opacity={opacity} />
        <Path d={createStar8(200, 200, 60, 30)} fill="none" stroke={primaryColor} strokeWidth="0.5" opacity={opacity * 0.6} />

        {/* Inner pattern circles */}
        <Circle cx="200" cy="200" r="45" fill="none" stroke={primaryColor} strokeWidth="1" opacity={opacity * 0.7} />
        <Circle cx="200" cy="200" r="25" fill={primaryColor} opacity={opacity * 0.3} />
        <Circle cx="200" cy="200" r="15" fill="none" stroke={primaryColor} strokeWidth="1.5" opacity={opacity * 0.8} />
        <Circle cx="200" cy="200" r="8" fill={primaryColor} opacity={opacity * 0.5} />

        {/* Smaller 8-pointed stars around the main one */}
        {[...Array(8)].map((_, i) => {
          const angle = (i * Math.PI * 2) / 8;
          const x = 200 + 120 * Math.cos(angle);
          const y = 200 + 120 * Math.sin(angle);
          return (
            <G key={`star-${i}`}>
              <Path d={createStar8(x, y, 25, 12)} fill="url(#goldGrad)" stroke={primaryColor} strokeWidth="0.5" opacity={opacity * 0.7} />
              <Circle cx={x} cy={y} r="6" fill={primaryColor} opacity={opacity * 0.4} />
            </G>
          );
        })}

        {/* Connecting lines between stars */}
        {[...Array(8)].map((_, i) => {
          const angle1 = (i * Math.PI * 2) / 8;
          const angle2 = ((i + 1) * Math.PI * 2) / 8;
          const x1 = 200 + 120 * Math.cos(angle1);
          const y1 = 200 + 120 * Math.sin(angle1);
          const x2 = 200 + 120 * Math.cos(angle2);
          const y2 = 200 + 120 * Math.sin(angle2);
          return (
            <Line key={`line-${i}`} x1={x1} y1={y1} x2={x2} y2={y2} stroke={primaryColor} strokeWidth="0.5" opacity={opacity * 0.4} />
          );
        })}

        {/* Outer ring of smaller patterns */}
        {[...Array(16)].map((_, i) => {
          const angle = (i * Math.PI * 2) / 16;
          const x = 200 + 160 * Math.cos(angle);
          const y = 200 + 160 * Math.sin(angle);
          return (
            <G key={`outer-${i}`}>
              <Circle cx={x} cy={y} r="10" fill="none" stroke={primaryColor} strokeWidth="0.5" opacity={opacity * 0.5} />
              <Circle cx={x} cy={y} r="4" fill={primaryColor} opacity={opacity * 0.3} />
            </G>
          );
        })}

        {/* Arabesque curves connecting centers */}
        {[...Array(4)].map((_, i) => {
          const angle = (i * Math.PI) / 2;
          return (
            <G key={`curve-${i}`} transform={`rotate(${(i * 90)}, 200, 200)`}>
              <Path
                d="M 200 155 Q 230 130 260 155 Q 290 180 320 155"
                fill="none"
                stroke={primaryColor}
                strokeWidth="0.8"
                opacity={opacity * 0.4}
              />
              <Path
                d="M 200 155 Q 170 130 140 155 Q 110 180 80 155"
                fill="none"
                stroke={primaryColor}
                strokeWidth="0.8"
                opacity={opacity * 0.4}
              />
            </G>
          );
        })}
      </Svg>
    </Animated.View>
  );
}

export default IslamicGeometricPattern;

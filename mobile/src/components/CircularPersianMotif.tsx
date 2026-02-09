import React from 'react';
import Svg, { Circle, Ellipse, G, Path } from 'react-native-svg';

interface CircularPersianMotifProps {
  size?: number;
  color?: string;
  opacity?: number;
}

export function CircularPersianMotif({ 
  size = 300, 
  color = '#3b82f6',
  opacity = 0.15 
}: CircularPersianMotifProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 300 300">
      {/* Outer decorative border */}
      <Circle
        cx="150"
        cy="150"
        r="140"
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        opacity={0.3}
      />
      <Circle
        cx="150"
        cy="150"
        r="135"
        fill="none"
        stroke={color}
        strokeWidth="0.8"
        opacity={0.2}
      />
      
      {/* Spiral decorations around border */}
      {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => {
        const rad = (angle * Math.PI) / 180;
        const x = 150 + Math.cos(rad) * 137;
        const y = 150 + Math.sin(rad) * 137;
        return (
          <G key={i} transform={`translate(${x}, ${y}) rotate(${angle})`}>
            <Path
              d="M 0 0 Q 3 -2 5 0 Q 5 3 3 5 Q 0 5 -2 3 Q -2 0 0 0"
              fill="none"
              stroke={color}
              strokeWidth="0.5"
              opacity={0.3}
            />
            <Circle cx="0" cy="0" r="1" fill={color} opacity={0.3} />
          </G>
        );
      })}
      
      {/* Inner decorative ring */}
      <Circle
        cx="150"
        cy="150"
        r="100"
        fill="none"
        stroke={color}
        strokeWidth="1.2"
        opacity={0.25}
      />
      
      {/* Central floral composition */}
      <G transform="translate(150, 150)">
        <Circle cx="0" cy="0" r="15" fill={color} opacity={0.2} />
        <Circle cx="0" cy="0" r="10" fill="none" stroke={color} strokeWidth="1" opacity={0.3} />
        <Circle cx="0" cy="0" r="6" fill={color} opacity={0.25} />
        
        {/* Petals in layers */}
        {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((angle, i) => (
          <G key={i} transform={`rotate(${angle})`}>
            <Ellipse
              cx="20"
              cy="0"
              rx="12"
              ry="6"
              fill={color}
              opacity={0.15}
            />
            <Ellipse
              cx="20"
              cy="0"
              rx="8"
              ry="4"
              fill="none"
              stroke={color}
              strokeWidth="0.5"
              opacity={0.2}
            />
          </G>
        ))}
        
        {/* Flowing arabesque branches */}
        {[0, 90, 180, 270].map((angle, i) => (
          <G key={i} transform={`rotate(${angle})`}>
            <Path
              d="M 30 0 Q 50 -15 70 0 Q 85 10 80 -5"
              fill="none"
              stroke={color}
              strokeWidth="0.7"
              opacity={0.2}
            />
            <Ellipse cx="55" cy="-5" rx="5" ry="3" fill={color} opacity={0.15} />
            <Ellipse cx="75" cy="5" rx="4" ry="2" fill={color} opacity={0.1} />
          </G>
        ))}
        
        {/* Secondary flower ring */}
        {[0, 60, 120, 180, 240, 300].map((angle, i) => (
          <G key={i} transform={`rotate(${angle})`}>
            <Circle cx="45" cy="0" r="8" fill={color} opacity={0.1} />
            <Circle cx="45" cy="0" r="5" fill="none" stroke={color} strokeWidth="0.5" opacity={0.2} />
            {[0, 60, 120, 180, 240, 300].map((pAngle, j) => (
              <Ellipse
                key={j}
                cx={45 + Math.cos((pAngle * Math.PI) / 180) * 10}
                cy={Math.sin((pAngle * Math.PI) / 180) * 10}
                rx="4"
                ry="2"
                fill={color}
                opacity={0.08}
                transform={`rotate(${pAngle}, 45, 0)`}
              />
            ))}
          </G>
        ))}
      </G>
    </Svg>
  );
}

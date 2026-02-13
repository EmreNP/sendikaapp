import React from 'react';
import { View, StyleSheet, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

// Unsplash Persian tile images - same as front
const TILE_IMAGES = [
  'https://images.unsplash.com/photo-1584551246679-0daf3d275d0f?w=400&q=80',
  'https://images.unsplash.com/photo-1565280717-8fe267f9c6a4?w=400&q=80',
  'https://images.unsplash.com/photo-1578301978693-85fa9c0320b9?w=400&q=80',
  'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=400&q=80',
];

interface IslamicTileBackgroundProps {
  opacity?: number;
}

export function IslamicTileBackground({ opacity = 0.1 }: IslamicTileBackgroundProps) {
  return (
    <View style={[styles.container, { opacity }]}>
      {/* Base gradient */}
      <LinearGradient
        colors={['#0f172a', '#312e81', '#0f172a']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      
      {/* Tile pattern overlay */}
      <View style={styles.tilesContainer}>
        {TILE_IMAGES.map((uri, index) => (
          <Image
            key={index}
            source={{ uri }}
            style={[
              styles.tile,
              getTilePosition(index),
            ]}
            blurRadius={2}
            resizeMode="cover"
          />
        ))}
      </View>
      
      {/* Gradient overlay */}
      <LinearGradient
        colors={['rgba(15, 23, 42, 0.8)', 'rgba(49, 46, 129, 0.6)', 'rgba(15, 23, 42, 0.8)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
    </View>
  );
}

function getTilePosition(index: number) {
  const positions = [
    { top: -50, left: -50 },
    { top: -30, right: -30 },
    { bottom: 100, left: -20 },
    { bottom: -30, right: -50 },
  ];
  return positions[index] || {};
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  tilesContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  tile: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    opacity: 0.5,
  },
});

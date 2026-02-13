import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';

// Bundled tile images - no network dependency
const TILE_IMAGES = [
  require('../../assets/images/tiles/tile_1.jpg'),
  require('../../assets/images/tiles/tile_2.jpg'),
  require('../../assets/images/tiles/tile_3.jpg'),
  require('../../assets/images/tiles/tile_4.jpg'),
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
        {TILE_IMAGES.map((source, index) => (
          <Image
            key={index}
            source={source}
            style={[
              styles.tile,
              getTilePosition(index),
            ]}
            blurRadius={2}
            contentFit="cover"
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

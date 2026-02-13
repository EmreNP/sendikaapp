/**
 * SkeletonLoader — Skeleton/Placeholder loading bileşeni.
 * ActivityIndicator yerine kullanılarak daha iyi bir UX sağlar.
 *
 * Kullanım:
 *   <SkeletonLoader width={200} height={20} />
 *   <SkeletonLoader width="100%" height={120} borderRadius={16} />
 *   <CardSkeleton />
 *   <ListItemSkeleton />
 */
import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing, Dimensions } from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface SkeletonLoaderProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: object;
}

export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  width = '100%',
  height = 20,
  borderRadius = 8,
  style,
}) => {
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(shimmerAnim, {
        toValue: 1,
        duration: 1200,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  const translateX = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-SCREEN_WIDTH, SCREEN_WIDTH],
  });

  return (
    <View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor: '#e2e8f0',
          overflow: 'hidden',
        },
        style,
      ]}
      accessibilityLabel="Yükleniyor"
      accessibilityRole="progressbar"
    >
      <Animated.View
        style={{
          ...StyleSheet.absoluteFillObject,
          backgroundColor: 'rgba(255, 255, 255, 0.4)',
          transform: [{ translateX }],
          width: '60%',
        }}
      />
    </View>
  );
};

/** Kart benzeri skeleton — Haberler, Duyurular, Eğitimler listesi için */
export const CardSkeleton: React.FC<{ count?: number }> = ({ count = 3 }) => (
  <View style={skeletonStyles.container}>
    {Array.from({ length: count }).map((_, i) => (
      <View key={i} style={skeletonStyles.card}>
        <SkeletonLoader width="100%" height={160} borderRadius={12} />
        <View style={skeletonStyles.cardContent}>
          <SkeletonLoader width="70%" height={18} style={{ marginBottom: 8 }} />
          <SkeletonLoader width="100%" height={14} style={{ marginBottom: 4 }} />
          <SkeletonLoader width="60%" height={14} />
        </View>
      </View>
    ))}
  </View>
);

/** Liste öğesi skeleton — Bildirimler, Şubeler listesi için */
export const ListItemSkeleton: React.FC<{ count?: number }> = ({ count = 5 }) => (
  <View style={skeletonStyles.container}>
    {Array.from({ length: count }).map((_, i) => (
      <View key={i} style={skeletonStyles.listItem}>
        <SkeletonLoader width={48} height={48} borderRadius={24} />
        <View style={skeletonStyles.listItemContent}>
          <SkeletonLoader width="65%" height={16} style={{ marginBottom: 6 }} />
          <SkeletonLoader width="90%" height={12} />
        </View>
      </View>
    ))}
  </View>
);

/** Detay sayfası skeleton — Haber/Duyuru detay sayfaları için */
export const DetailSkeleton: React.FC = () => (
  <View style={skeletonStyles.container}>
    <SkeletonLoader width="100%" height={220} borderRadius={0} />
    <View style={skeletonStyles.detailContent}>
      <SkeletonLoader width="85%" height={22} style={{ marginBottom: 12 }} />
      <SkeletonLoader width="40%" height={14} style={{ marginBottom: 20 }} />
      <SkeletonLoader width="100%" height={14} style={{ marginBottom: 8 }} />
      <SkeletonLoader width="100%" height={14} style={{ marginBottom: 8 }} />
      <SkeletonLoader width="100%" height={14} style={{ marginBottom: 8 }} />
      <SkeletonLoader width="75%" height={14} />
    </View>
  </View>
);

const skeletonStyles = StyleSheet.create({
  container: {
    padding: 16,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardContent: {
    padding: 16,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  listItemContent: {
    flex: 1,
    marginLeft: 12,
  },
  detailContent: {
    padding: 20,
  },
});

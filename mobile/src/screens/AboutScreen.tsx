// AboutScreen - Hakkımızda Sayfası
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types';

type AboutScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'About'>;

interface AboutScreenProps {
  navigation: AboutScreenNavigationProp;
}

export const AboutScreen: React.FC<AboutScreenProps> = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <LinearGradient
        colors={['#4f46e5', '#6366f1']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.header}
      >
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Feather name="arrow-left" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Hakkımızda</Text>
        <View style={{ width: 40 }} />
      </LinearGradient>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Misyon Kartı */}
        <LinearGradient
          colors={['#3b82f6', '#2563eb']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.card}
        >
          <View style={styles.cardIconContainer}>
            <Feather name="target" size={32} color="#fff" />
          </View>
          <Text style={styles.cardTitle}>Misyonumuz</Text>
          <Text style={styles.cardDescription}>
            Konya Büyükşehir Belediyesi'nde çalışan tüm üyelerin hak ve
            çıkarlarını korumak, iş güvencesi sağlamak ve adil çalışma
            koşullarını sağlamaktır. Sendikamız, çalışanlarımızın sorunlarına
            duyarlılık gösterir, sosyal ve ekonomik refahlarını artırmayı
            hedefler ve çalışma yaşamında güçlü bir dayanışma sağlamaktadır.
          </Text>
        </LinearGradient>

        {/* Vizyon Kartı */}
        <LinearGradient
          colors={['#8b5cf6', '#7c3aed']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.card}
        >
          <View style={styles.cardIconContainer}>
            <Feather name="award" size={32} color="#fff" />
          </View>
          <Text style={styles.cardTitle}>Vizyonumuz</Text>
          <Text style={styles.cardDescription}>
            Konya'da yerel yönetimde çalışan ve sendikamıza üye olan herkesin
            hak ve çıkarlarını en etkin şekilde savunabilecek, profesyonel
            yönetim anlayışı ve güçlü dayanışma ruhuyla sektörün lider sendikası
            olarak tanınmaktadır.
          </Text>
        </LinearGradient>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.5,
  },
  scrollContent: {
    padding: 20,
    gap: 20,
  },
  card: {
    borderRadius: 16,
    padding: 24,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  cardIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  cardDescription: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.95)',
    lineHeight: 24,
    letterSpacing: 0.2,
  },
});

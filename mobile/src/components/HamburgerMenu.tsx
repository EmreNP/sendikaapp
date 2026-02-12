// HamburgerMenu - Frontend ile birebir (front/src/components/HamburgerMenu.tsx)
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Animated,
  Dimensions,
  Linking,
  ScrollView,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const MENU_WIDTH = screenWidth * 0.85;

interface HamburgerMenuProps {
  onDistrictRepClick?: () => void;
  onMembershipClick?: () => void;
  onNotificationsClick?: () => void;
  onAboutClick?: () => void;
}

const socialLinks = [
  { icon: 'facebook', label: 'Facebook', href: 'https://www.facebook.com/share/17xcaDfcmz/?mibextid=wwXIfr', color: '#1877F2' },
  { icon: 'twitter', label: 'X', href: 'https://x.com/tdvskonya?s=11', color: '#000000' },
  { icon: 'instagram', label: 'Instagram', href: 'https://www.instagram.com/tdvskonya?igsh=NzAzbjk0emw5MjNy&utm_source=qr', color: '#E1306C' },
  { icon: 'youtube', label: 'YouTube', href: 'https://youtube.com/@turkdiyanetvakif-senkonya?si=7sI8kUPWQu2pQsSw', color: '#FF0000' },
];

export const HamburgerMenu: React.FC<HamburgerMenuProps> = ({
  onDistrictRepClick,
  onMembershipClick,
  onNotificationsClick,
  onAboutClick,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const slideAnim = useRef(new Animated.Value(MENU_WIDTH)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const { role, logout, user } = useAuth();

  const openMenu = () => {
    setIsOpen(true);
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const closeMenu = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: MENU_WIDTH,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => setIsOpen(false));
  };

  const handleLogout = () => {
    closeMenu();
    Alert.alert(
      'Çıkış Yap',
      'Hesabınızdan çıkış yapmak istediğinizden emin misiniz?',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Çıkış Yap',
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
            } catch (error) {
              Alert.alert('Hata', 'Çıkış yapılırken bir hata oluştu');
            }
          },
        },
      ]
    );
  };

  const handleSocialLink = (url: string) => {
    Linking.openURL(url);
  };

  return (
    <>
      {/* Hamburger Button - Premium Dark Design */}
      <TouchableOpacity
        style={styles.hamburgerButton}
        onPress={openMenu}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={['#1e293b', '#0f172a', '#020617']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.hamburgerGradient}
        >
          <View style={styles.hamburgerShine} />
          <Feather name="menu" size={22} color="#ffffff" />
        </LinearGradient>
      </TouchableOpacity>

      {/* Menu Modal */}
      <Modal
        visible={isOpen}
        transparent
        animationType="none"
        onRequestClose={closeMenu}
        statusBarTranslucent
      >
        {/* Backdrop */}
        <Animated.View
          style={[styles.backdrop, { opacity: fadeAnim }]}
        >
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            onPress={closeMenu}
            activeOpacity={1}
          />
        </Animated.View>

        {/* Slide-in Menu */}
        <Animated.View
          style={[
            styles.menuContainer,
            { transform: [{ translateX: slideAnim }] },
          ]}
        >
          <LinearGradient
            colors={['#f8fafc', '#ffffff', '#f8fafc']}
            style={styles.menuGradient}
          >
            <ScrollView 
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.menuContent}
            >
              {/* Top Action Cards */}
              <View style={styles.topCardsRow}>
                {/* Member Registration or District Rep */}
                {role === 'branch_manager' ? (
                  <TouchableOpacity
                    style={styles.actionCardHalf}
                    onPress={() => {
                      closeMenu();
                      onDistrictRepClick?.();
                    }}
                    activeOpacity={0.9}
                  >
                    <LinearGradient
                      colors={['#7c3aed', '#6d28d9', '#5b21b6']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.actionCardGradient}
                    >
                      <View style={styles.cardGlow} />
                      <View style={styles.cardHeader}>
                        <View style={styles.cardIconBg}>
                          <Feather name="briefcase" size={16} color="#ffffff" />
                        </View>
                        <View style={styles.cardBadgePurple}>
                          <Text style={styles.cardBadgeText}>Özel</Text>
                        </View>
                      </View>
                      <View style={styles.cardFooter}>
                        <Text style={styles.cardTitle}>İlçe İşyeri Temsilcisi</Text>
                        <View style={styles.cardAction}>
                          <Text style={styles.cardActionText}>Görüntüle</Text>
                          <Feather name="chevron-right" size={12} color="rgba(255,255,255,0.8)" />
                        </View>
                      </View>
                    </LinearGradient>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={styles.actionCardHalf}
                    onPress={() => {
                      closeMenu();
                      onMembershipClick?.();
                    }}
                    activeOpacity={0.9}
                  >
                    <LinearGradient
                      colors={['#2563eb', '#1d4ed8', '#1e40af']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.actionCardGradient}
                    >
                      <View style={styles.cardGlow} />
                      <View style={styles.cardHeader}>
                        <View style={styles.cardIconBg}>
                          <Feather name="user-plus" size={16} color="#ffffff" />
                        </View>
                        <View style={styles.cardBadgeOrange}>
                          <Text style={styles.cardBadgeText}>Yeni</Text>
                        </View>
                      </View>
                      <View style={styles.cardFooter}>
                        <Text style={styles.cardTitle}>Üye Kayıt</Text>
                        <View style={styles.cardAction}>
                          <Text style={styles.cardActionText}>Görüntüle</Text>
                          <Feather name="chevron-right" size={12} color="rgba(255,255,255,0.8)" />
                        </View>
                      </View>
                    </LinearGradient>
                  </TouchableOpacity>
                )}

                {/* Notifications Card */}
                <TouchableOpacity
                  style={styles.actionCardHalf}
                  onPress={() => {
                    closeMenu();
                    onNotificationsClick?.();
                  }}
                  activeOpacity={0.9}
                >
                  <View style={styles.notificationCard}>
                    <View style={styles.cardHeader}>
                      <View style={styles.notificationIconBg}>
                        <Feather name="bell" size={16} color="#334155" />
                      </View>
                      <View style={styles.cardBadgeRed}>
                        <Text style={styles.cardBadgeText}>5</Text>
                      </View>
                    </View>
                    <View style={styles.cardFooter}>
                      <Text style={styles.notificationTitle}>Bildirimler</Text>
                      <Text style={styles.notificationSubtext}>5 yeni</Text>
                      <View style={styles.cardAction}>
                        <Text style={styles.notificationActionText}>Görüntüle</Text>
                        <Feather name="chevron-right" size={12} color="#64748b" />
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              </View>

              {/* About Button */}
              <TouchableOpacity
                style={styles.aboutButton}
                onPress={() => {
                  closeMenu();
                  onAboutClick?.();
                }}
                activeOpacity={0.8}
              >
                <View style={styles.aboutIconBg}>
                  <Feather name="info" size={18} color="#ffffff" />
                </View>
                <View style={styles.aboutTextContainer}>
                  <Text style={styles.aboutTitle}>Hakkımızda</Text>
                  <Text style={styles.aboutSubtitle}>Kurumumuz ve değerlerimiz</Text>
                </View>
                <Feather name="chevron-right" size={20} color="#cbd5e1" />
              </TouchableOpacity>

              {/* Contact Section */}
              <View style={styles.contactSection}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>İLETİŞİM</Text>
                  <View style={styles.sectionLine} />
                </View>

                <TouchableOpacity
                  style={styles.contactItem}
                  onPress={() => Linking.openURL('tel:+903322211234')}
                  activeOpacity={0.7}
                >
                  <LinearGradient
                    colors={['#2563eb', '#1d4ed8']}
                    style={styles.contactIconBg}
                  >
                    <Feather name="phone" size={14} color="#ffffff" />
                  </LinearGradient>
                  <View style={styles.contactTextContainer}>
                    <Text style={styles.contactLabel}>Telefon</Text>
                    <Text style={styles.contactValue}>+90 (332) 221 12 34</Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.contactItem}
                  onPress={() => Linking.openURL('mailto:info@tdvakifsen-konya.org.tr')}
                  activeOpacity={0.7}
                >
                  <LinearGradient
                    colors={['#2563eb', '#1d4ed8']}
                    style={styles.contactIconBg}
                  >
                    <Feather name="mail" size={14} color="#ffffff" />
                  </LinearGradient>
                  <View style={styles.contactTextContainer}>
                    <Text style={styles.contactLabel}>E-posta</Text>
                    <Text style={styles.contactValue}>info@tdvakifsen-konya.org.tr</Text>
                  </View>
                </TouchableOpacity>

                <View style={styles.contactItem}>
                  <LinearGradient
                    colors={['#2563eb', '#1d4ed8']}
                    style={styles.contactIconBg}
                  >
                    <Feather name="map-pin" size={14} color="#ffffff" />
                  </LinearGradient>
                  <View style={styles.contactTextContainer}>
                    <Text style={styles.contactLabel}>Adres</Text>
                    <Text style={styles.contactValue}>Konya, Türkiye</Text>
                  </View>
                </View>
              </View>

              {/* Social Media Section */}
              <View style={styles.socialSection}>
                <LinearGradient
                  colors={['#0f172a', '#1e293b', '#0f172a']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.socialGradient}
                >
                  <View style={styles.socialGlow} />
                  <View style={styles.sectionHeaderDark}>
                    <Text style={styles.sectionTitleDark}>SOSYAL MEDYA</Text>
                    <View style={styles.sectionLineDark} />
                  </View>
                  <View style={styles.socialIconsRow}>
                    {socialLinks.map((social) => (
                      <TouchableOpacity
                        key={social.label}
                        style={styles.socialIconButton}
                        onPress={() => handleSocialLink(social.href)}
                        activeOpacity={0.7}
                      >
                        <Feather name={social.icon as any} size={18} color="#ffffff" />
                      </TouchableOpacity>
                    ))}
                  </View>
                </LinearGradient>
              </View>

              {/* User Info & Logout */}
              <View style={styles.userSection}>
                <View style={styles.userInfo}>
                  <View style={styles.userAvatar}>
                    <Text style={styles.userAvatarText}>
                      {user?.firstName?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}
                    </Text>
                  </View>
                  <View style={styles.userTextContainer}>
                    <Text style={styles.userName}>
                      {user?.firstName && user?.lastName
                        ? `${user.firstName} ${user.lastName}`
                        : user?.email || 'Kullanıcı'}
                    </Text>
                    <Text style={styles.userRole}>
                      {role === 'admin' ? 'Yönetici' : role === 'branch_manager' ? 'Şube Yöneticisi' : 'Üye'}
                    </Text>
                  </View>
                </View>
                
                <TouchableOpacity
                  style={styles.logoutButton}
                  onPress={handleLogout}
                  activeOpacity={0.8}
                >
                  <View style={styles.logoutIconBg}>
                    <Feather name="log-out" size={16} color="#dc2626" />
                  </View>
                  <Text style={styles.logoutText}>Çıkış Yap</Text>
                </TouchableOpacity>
              </View>

              {/* Footer */}
              <View style={styles.footer}>
                <View style={styles.footerBadge}>
                  <View style={styles.footerDot} />
                  <Text style={styles.footerText}>© 2026 TDVS KONYA</Text>
                </View>
              </View>
            </ScrollView>
          </LinearGradient>
        </Animated.View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  // Hamburger Button
  hamburgerButton: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  hamburgerGradient: {
    padding: 12,
    borderRadius: 16,
    position: 'relative',
    overflow: 'hidden',
  },
  hamburgerShine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(59, 130, 246, 0.05)',
  },
  // Modal
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  menuContainer: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: MENU_WIDTH,
    shadowColor: '#000',
    shadowOffset: { width: -10, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 20,
  },
  menuGradient: {
    flex: 1,
  },
  menuContent: {
    padding: 16,
    paddingTop: 60,
    paddingBottom: 32,
  },
  // Top Cards
  topCardsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  actionCardHalf: {
    flex: 1,
    height: 140,
    borderRadius: 16,
    overflow: 'hidden',
  },
  actionCardGradient: {
    flex: 1,
    padding: 14,
    justifyContent: 'space-between',
    position: 'relative',
    overflow: 'hidden',
  },
  cardGlow: {
    position: 'absolute',
    top: -40,
    right: -40,
    width: 120,
    height: 120,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 60,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cardIconBg: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardBadgePurple: {
    backgroundColor: 'rgba(167,139,250,0.9)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  cardBadgeOrange: {
    backgroundColor: '#f97316',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  cardBadgeRed: {
    backgroundColor: '#ef4444',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  cardBadgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '600',
  },
  cardFooter: {
    gap: 2,
  },
  cardTitle: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  cardAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginTop: 4,
  },
  cardActionText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 11,
    fontWeight: '500',
  },
  // Notification Card
  notificationCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    padding: 14,
    justifyContent: 'space-between',
  },
  notificationIconBg: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationTitle: {
    color: '#1e293b',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  notificationSubtext: {
    color: '#64748b',
    fontSize: 11,
    fontWeight: '500',
  },
  notificationActionText: {
    color: '#64748b',
    fontSize: 11,
    fontWeight: '500',
  },
  // About Button
  aboutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 14,
    marginBottom: 12,
    gap: 12,
  },
  aboutIconBg: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#2563eb',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  aboutTextContainer: {
    flex: 1,
  },
  aboutTitle: {
    color: '#1e293b',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  aboutSubtitle: {
    color: '#64748b',
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  // Contact Section
  contactSection: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 14,
    marginBottom: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  sectionTitle: {
    color: '#1e293b',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  sectionLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#2563eb',
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
  },
  contactIconBg: {
    width: 34,
    height: 34,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  contactTextContainer: {
    flex: 1,
  },
  contactLabel: {
    color: '#64748b',
    fontSize: 10,
    fontWeight: '500',
  },
  contactValue: {
    color: '#1e293b',
    fontSize: 13,
    fontWeight: '700',
  },
  // Social Section
  socialSection: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 12,
  },
  socialGradient: {
    padding: 14,
    position: 'relative',
    overflow: 'hidden',
  },
  socialGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(37, 99, 235, 0.15)',
  },
  sectionHeaderDark: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  sectionTitleDark: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  sectionLineDark: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  socialIconsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  socialIconButton: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  // User Section
  userSection: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 14,
    marginBottom: 12,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  userAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#2563eb',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userAvatarText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
  },
  userTextContainer: {
    flex: 1,
  },
  userName: {
    color: '#1e293b',
    fontSize: 14,
    fontWeight: '700',
  },
  userRole: {
    color: '#64748b',
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fef2f2',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fecaca',
    padding: 12,
    gap: 8,
  },
  logoutIconBg: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#fee2e2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoutText: {
    color: '#dc2626',
    fontSize: 14,
    fontWeight: '600',
  },
  // Footer
  footer: {
    alignItems: 'center',
    marginTop: 8,
  },
  footerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.6)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 6,
  },
  footerDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#2563eb',
  },
  footerText: {
    color: '#64748b',
    fontSize: 10,
    fontWeight: '500',
  },
});

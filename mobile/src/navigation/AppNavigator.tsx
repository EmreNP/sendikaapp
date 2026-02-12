// App Navigator - Main Navigation Setup
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import type { RootStackParamList, MainTabParamList } from '../types';

// Import Screens
import {
  WelcomeScreen,
  LoginScreen,
  SignupScreen,
  HomeScreen,
  CoursesScreen,
  CourseDetailScreen,
  TestScreen,
  BranchesScreen,
  BranchDetailScreen,
  AllNewsScreen,
  NewsDetailScreen,
  AllAnnouncementsScreen,
  ContactScreen,
  MembershipScreen,
  PendingApprovalScreen,
  RejectedScreen,
  ProfileScreen,
  MuktesepScreen,
  DistrictRepresentativeScreen,
  PartnerInstitutionsScreen,
  PartnerDetailScreen,
  DocumentScreen,
  // PDFViewerScreen, // Native PDF viewer commented out to avoid crashes
} from '../screens';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

// Tab Bar Icon Component - Feather icons (Frontend BottomNavigation.tsx ile birebir)
const TabIcon = ({ name, focused }: { name: keyof typeof Feather.glyphMap; focused: boolean }) => (
  <Feather 
    name={name} 
    size={24} 
    color={focused ? '#2563eb' : '#64748b'} 
  />
);

// Main Tab Navigator
const MainTabs = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: '#2563eb', // blue-600 (frontend ile aynı)
        tabBarInactiveTintColor: '#64748b', // gray-500
        tabBarLabelStyle: styles.tabLabel,
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarLabel: 'Ana Sayfa',
          tabBarIcon: ({ focused }) => <TabIcon name="home" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Courses"
        component={CoursesScreen}
        options={{
          tabBarLabel: 'Eğitimler',
          tabBarIcon: ({ focused }) => <TabIcon name="book-open" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Branches"
        component={BranchesScreen}
        options={{
          tabBarLabel: 'Şubeler',
          tabBarIcon: ({ focused }) => <TabIcon name="map-pin" focused={focused} />,
        }}
      />
    </Tab.Navigator>
  );
};

// Loading Screen
const LoadingScreen = () => (
  <View style={styles.loadingContainer}>
    <ActivityIndicator size="large" color="#4338ca" />
  </View>
);

// Main App Navigator
export const AppNavigator = () => {
  const { isAuthenticated, isLoading, status, isAdmin } = useAuth();

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isAuthenticated ? (
          // Auth Stack
          <>
            <Stack.Screen name="Welcome" component={WelcomeScreen} />
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Signup" component={SignupScreen} />
          </>
        ) : status === 'rejected' ? (
          // Rejected
          <Stack.Screen name="Rejected" component={RejectedScreen} />
        ) : (
          // Main App Stack (everyone except rejected can access; training access is handled within CoursesScreen)
          // Main App Stack
          <>
            <Stack.Screen name="MainTabs" component={MainTabs} />
            <Stack.Screen name="CourseDetail" component={CourseDetailScreen} />
            <Stack.Screen name="Test" component={TestScreen} />
            <Stack.Screen name="Document" component={DocumentScreen} />
            <Stack.Screen name="BranchDetail" component={BranchDetailScreen} />
            <Stack.Screen name="AllNews" component={AllNewsScreen} />
            <Stack.Screen name="NewsDetail" component={NewsDetailScreen} />
            <Stack.Screen name="AllAnnouncements" component={AllAnnouncementsScreen} />
            <Stack.Screen name="Contact" component={ContactScreen} />
            <Stack.Screen name="Membership" component={MembershipScreen} />
            <Stack.Screen name="Muktesep" component={MuktesepScreen} />
            <Stack.Screen name="DistrictRepresentative" component={DistrictRepresentativeScreen} />
            <Stack.Screen name="PartnerInstitutions" component={PartnerInstitutionsScreen} />
            <Stack.Screen name="PartnerDetail" component={PartnerDetailScreen} />
            <Stack.Screen name="Profile" component={ProfileScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  tabBar: {
    backgroundColor: 'rgba(255,255,255,0.9)', // bg-white/90
    borderTopWidth: 1,
    borderTopColor: 'rgba(229,231,235,0.6)', // gray-200/60
    height: 64, // h-16
    paddingBottom: 8,
    paddingTop: 8,
    shadowColor: '#1e40af', // blue-900/10
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 8,
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 4,
  },
});

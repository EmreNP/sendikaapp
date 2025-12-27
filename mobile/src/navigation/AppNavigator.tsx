import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import { LoginScreen } from '../screens/LoginScreen';
import { RegisterBasicScreen } from '../screens/RegisterBasicScreen';
import { RegisterDetailsScreen } from '../screens/RegisterDetailsScreen';
import { StatusScreen } from '../screens/StatusScreen';
import type { RootStackParamList } from '../types';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { COLORS } from '../constants/theme';

const Stack = createNativeStackNavigator<RootStackParamList>();

export const AppNavigator: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
        }}
      >
        {!user ? (
          // Auth Stack
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="RegisterBasic" component={RegisterBasicScreen} />
            <Stack.Screen name="RegisterDetails" component={RegisterDetailsScreen} />
          </>
        ) : (
          // Main Stack
          <>
            {user.status === 'pending_details' ? (
              <Stack.Screen name="RegisterDetails" component={RegisterDetailsScreen} />
            ) : (
              <Stack.Screen name="Status" component={StatusScreen} />
            )}
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
    backgroundColor: COLORS.background,
  },
});


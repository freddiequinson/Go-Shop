/**
 * Splash/Welcome Screen
 * Initial screen that redirects based on auth state
 */

import { useEffect } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { Colors } from '@/constants/theme';

export default function Index() {
  const router = useRouter();
  const { isAuthenticated, isLoading, user } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated && user) {
        // Route based on user type
        const userType = user.user_type?.toUpperCase();
        if (userType === 'ADMIN') {
          router.replace('/(tabs)/admin');
        } else if (userType === 'SUPPLIER') {
          router.replace('/(tabs)/supplier');
        } else if (userType === 'SELLER') {
          router.replace('/(tabs)/seller');
        } else if (userType === 'RIDER') {
          router.replace('/(tabs)/rider');
        } else {
          router.replace('/(tabs)/shop');
        }
      } else {
        router.replace('/(auth)/welcome');
      }
    }
  }, [isLoading, isAuthenticated, user]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>GoShop Ghana</Text>
      <ActivityIndicator size="large" color={Colors.light.primary} />
      <Text style={styles.subtitle}>Loading...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.light.background,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: Colors.light.primary,
    marginBottom: 20,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.light.mutedForeground,
    marginTop: 20,
  },
});

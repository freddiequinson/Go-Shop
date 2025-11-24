/**
 * Welcome/Onboarding Screen
 * First screen users see when opening the app
 */

import { View, Text, StyleSheet, Image, TouchableOpacity, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Colors, Spacing, Typography, BorderRadius } from '@/constants/theme';

const { width } = Dimensions.get('window');

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Logo and Branding */}
      <View style={styles.header}>
        <Text style={styles.logo}>🛒</Text>
        <Text style={styles.title}>GoShop Ghana</Text>
        <Text style={styles.subtitle}>Fresh Groceries from the Market</Text>
      </View>

      {/* Features */}
      <View style={styles.features}>
        <FeatureItem 
          icon="🥬" 
          title="Fresh Products" 
          description="Quality groceries delivered to your door"
        />
        <FeatureItem 
          icon="🚚" 
          title="Fast Delivery" 
          description="Same-day delivery available"
        />
        <FeatureItem 
          icon="💰" 
          title="Best Prices" 
          description="Competitive prices from local markets"
        />
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity 
          style={styles.primaryButton}
          onPress={() => router.push('/(auth)/register')}
        >
          <Text style={styles.primaryButtonText}>Get Started</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.secondaryButton}
          onPress={() => router.push('/(auth)/login')}
        >
          <Text style={styles.secondaryButtonText}>I already have an account</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function FeatureItem({ icon, title, description }: { icon: string; title: string; description: string }) {
  return (
    <View style={styles.featureItem}>
      <Text style={styles.featureIcon}>{icon}</Text>
      <View style={styles.featureContent}>
        <Text style={styles.featureTitle}>{title}</Text>
        <Text style={styles.featureDescription}>{description}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
    padding: Spacing.lg,
  },
  header: {
    alignItems: 'center',
    marginTop: Spacing.xxl * 2,
    marginBottom: Spacing.xxl,
  },
  logo: {
    fontSize: 80,
    marginBottom: Spacing.md,
  },
  title: {
    fontSize: Typography.fontSize['3xl'],
    fontWeight: 'bold',
    color: Colors.light.primary,
    marginBottom: Spacing.sm,
  },
  subtitle: {
    fontSize: Typography.fontSize.base,
    color: Colors.light.mutedForeground,
    textAlign: 'center',
  },
  features: {
    flex: 1,
    justifyContent: 'center',
    gap: Spacing.lg,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    backgroundColor: Colors.light.secondary,
    borderRadius: BorderRadius.lg,
  },
  featureIcon: {
    fontSize: 40,
    marginRight: Spacing.md,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '600',
    color: Colors.light.foreground,
    marginBottom: Spacing.xs,
  },
  featureDescription: {
    fontSize: Typography.fontSize.sm,
    color: Colors.light.mutedForeground,
  },
  actions: {
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  primaryButton: {
    backgroundColor: Colors.light.primary,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: Colors.light.primaryForeground,
    fontSize: Typography.fontSize.base,
    fontWeight: '600',
  },
  secondaryButton: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: Colors.light.primary,
    fontSize: Typography.fontSize.base,
    fontWeight: '500',
  },
});

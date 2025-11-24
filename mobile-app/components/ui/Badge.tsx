/**
 * Badge Component
 * Status badges for orders, products, etc.
 */

import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Colors, Spacing, Typography, BorderRadius } from '@/constants/theme';

type BadgeVariant = 'default' | 'success' | 'warning' | 'destructive' | 'secondary';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  style?: ViewStyle;
}

export default function Badge({ label, variant = 'default', style }: BadgeProps) {
  return (
    <View style={[styles.badge, styles[`badge_${variant}`], style]}>
      <Text style={[styles.text, styles[`text_${variant}`]]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    alignSelf: 'flex-start',
  },
  
  // Variants
  badge_default: {
    backgroundColor: Colors.light.primary,
  },
  badge_success: {
    backgroundColor: '#10b981',
  },
  badge_warning: {
    backgroundColor: '#f59e0b',
  },
  badge_destructive: {
    backgroundColor: Colors.light.destructive,
  },
  badge_secondary: {
    backgroundColor: Colors.light.secondary,
  },
  
  // Text styles
  text: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '600',
  },
  text_default: {
    color: Colors.light.primaryForeground,
  },
  text_success: {
    color: '#ffffff',
  },
  text_warning: {
    color: '#ffffff',
  },
  text_destructive: {
    color: Colors.light.primaryForeground,
  },
  text_secondary: {
    color: Colors.light.foreground,
  },
});

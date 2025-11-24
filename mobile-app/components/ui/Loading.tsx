/**
 * Loading Component
 * Centered loading spinner with optional text
 */

import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Colors, Spacing, Typography } from '@/constants/theme';

interface LoadingProps {
  text?: string;
  size?: 'small' | 'large';
}

export default function Loading({ text = 'Loading...', size = 'large' }: LoadingProps) {
  return (
    <View style={styles.container}>
      <ActivityIndicator size={size} color={Colors.light.primary} />
      {text && <Text style={styles.text}>{text}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.light.background,
    padding: Spacing.xl,
  },
  text: {
    marginTop: Spacing.md,
    fontSize: Typography.fontSize.base,
    color: Colors.light.mutedForeground,
  },
});

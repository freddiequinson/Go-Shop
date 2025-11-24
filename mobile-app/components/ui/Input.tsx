/**
 * Input Component
 * Reusable text input with label and error states
 */

import { View, Text, TextInput, StyleSheet, TextInputProps } from 'react-native';
import { Colors, Spacing, Typography, BorderRadius } from '@/constants/theme';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  icon?: string;
  helperText?: string;
}

export default function Input({
  label,
  error,
  icon,
  helperText,
  style,
  ...props
}: InputProps) {
  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      
      <View style={styles.inputContainer}>
        {icon && <Text style={styles.icon}>{icon}</Text>}
        <TextInput
          style={[
            styles.input,
            icon && styles.inputWithIcon,
            error && styles.inputError,
            style,
          ]}
          placeholderTextColor={Colors.light.mutedForeground}
          {...props}
        />
      </View>
      
      {error && <Text style={styles.errorText}>{error}</Text>}
      {helperText && !error && <Text style={styles.helperText}>{helperText}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.md,
  },
  label: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
    color: Colors.light.foreground,
    marginBottom: Spacing.sm,
  },
  inputContainer: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    position: 'absolute',
    left: Spacing.md,
    fontSize: 20,
    zIndex: 1,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: Typography.fontSize.base,
    color: Colors.light.foreground,
    backgroundColor: Colors.light.background,
  },
  inputWithIcon: {
    paddingLeft: Spacing.xxl + Spacing.sm,
  },
  inputError: {
    borderColor: Colors.light.destructive,
  },
  errorText: {
    color: Colors.light.destructive,
    fontSize: Typography.fontSize.sm,
    marginTop: Spacing.xs,
  },
  helperText: {
    color: Colors.light.mutedForeground,
    fontSize: Typography.fontSize.sm,
    marginTop: Spacing.xs,
  },
});

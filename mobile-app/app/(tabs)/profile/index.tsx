/**
 * Profile Screen
 * User profile and settings
 */

import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import userService from '@/services/user.service';
import { Colors, Spacing, Typography, BorderRadius } from '@/constants/theme';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [loadingWallet, setLoadingWallet] = useState(false);

  useEffect(() => {
    loadWalletBalance();
  }, []);

  const loadWalletBalance = async () => {
    try {
      setLoadingWallet(true);
      const data = await userService.getWalletBalance();
      setWalletBalance(data.balance);
    } catch (error) {
      console.error('Failed to load wallet:', error);
    } finally {
      setLoadingWallet(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', style: 'destructive', onPress: logout },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {user?.full_name?.charAt(0).toUpperCase() || '👤'}
          </Text>
        </View>
        <Text style={styles.name}>{user?.full_name || 'User'}</Text>
        <Text style={styles.email}>{user?.email}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          
          <MenuItem icon="👤" title="Edit Profile" onPress={() => {}} />
          <MenuItem icon="📍" title="Addresses" onPress={() => {}} />
          <MenuItem icon="💰" title="Wallet" onPress={() => {}} />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Settings</Text>
          
          <MenuItem icon="🔔" title="Notifications" onPress={() => {}} />
          <MenuItem icon="🌙" title="Dark Mode" onPress={() => {}} />
          <MenuItem icon="🌐" title="Language" onPress={() => {}} />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Support</Text>
          
          <MenuItem icon="❓" title="Help Center" onPress={() => {}} />
          <MenuItem icon="📧" title="Contact Us" onPress={() => {}} />
          <MenuItem icon="⭐" title="Rate App" onPress={() => {}} />
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

function MenuItem({ icon, title, onPress }: { icon: string; title: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.menuItem} onPress={onPress}>
      <Text style={styles.menuIcon}>{icon}</Text>
      <Text style={styles.menuTitle}>{title}</Text>
      <Text style={styles.menuArrow}>›</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  header: {
    alignItems: 'center',
    padding: Spacing.lg,
    paddingTop: Spacing.xxl,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.light.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  avatarText: {
    fontSize: 32,
    color: Colors.light.primaryForeground,
    fontWeight: 'bold',
  },
  name: {
    fontSize: Typography.fontSize.xl,
    fontWeight: 'bold',
    color: Colors.light.foreground,
    marginBottom: Spacing.xs,
  },
  email: {
    fontSize: Typography.fontSize.base,
    color: Colors.light.mutedForeground,
  },
  content: {
    padding: Spacing.lg,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
    color: Colors.light.mutedForeground,
    marginBottom: Spacing.md,
    textTransform: 'uppercase',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    backgroundColor: Colors.light.card,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  menuIcon: {
    fontSize: 24,
    marginRight: Spacing.md,
  },
  menuTitle: {
    flex: 1,
    fontSize: Typography.fontSize.base,
    color: Colors.light.foreground,
  },
  menuArrow: {
    fontSize: 24,
    color: Colors.light.mutedForeground,
  },
  logoutButton: {
    backgroundColor: Colors.light.destructive,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    marginTop: Spacing.lg,
  },
  logoutButtonText: {
    color: Colors.light.primaryForeground,
    fontSize: Typography.fontSize.base,
    fontWeight: '600',
  },
});

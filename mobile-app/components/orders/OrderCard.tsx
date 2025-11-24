/**
 * Order Card Component
 * Displays order information in a card format
 */

import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors, Spacing, Typography, BorderRadius } from '@/constants/theme';
import type { Order } from '@/types';
import Badge from '../ui/Badge';

interface OrderCardProps {
  order: Order;
  onPress?: () => void;
}

export default function OrderCard({ order, onPress }: OrderCardProps) {
  const totalAmount = (order.total_amount_cedis / 100).toFixed(2);
  const orderDate = new Date(order.created_at).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  const getStatusVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case 'delivered':
        return 'success';
      case 'cancelled':
        return 'destructive';
      case 'pending':
        return 'warning';
      default:
        return 'default';
    }
  };

  return (
    <TouchableOpacity 
      style={styles.card} 
      onPress={onPress}
      activeOpacity={0.7}
      disabled={!onPress}
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.orderId}>Order #{order.id}</Text>
          <Text style={styles.date}>{orderDate}</Text>
        </View>
        <Badge 
          label={order.status} 
          variant={getStatusVariant(order.status)}
        />
      </View>

      {/* Items Count */}
      <Text style={styles.itemsCount}>
        {order.items.length} {order.items.length === 1 ? 'item' : 'items'}
      </Text>

      {/* Footer */}
      <View style={styles.footer}>
        <View>
          <Text style={styles.totalLabel}>Total Amount</Text>
          <Text style={styles.totalAmount}>GH₵ {totalAmount}</Text>
        </View>
        {onPress && (
          <Text style={styles.viewDetails}>View Details →</Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.light.card,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.light.border,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  orderId: {
    fontSize: Typography.fontSize.base,
    fontWeight: '600',
    color: Colors.light.foreground,
    marginBottom: Spacing.xs,
  },
  date: {
    fontSize: Typography.fontSize.sm,
    color: Colors.light.mutedForeground,
  },
  itemsCount: {
    fontSize: Typography.fontSize.sm,
    color: Colors.light.mutedForeground,
    marginBottom: Spacing.md,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: Typography.fontSize.sm,
    color: Colors.light.mutedForeground,
    marginBottom: Spacing.xs,
  },
  totalAmount: {
    fontSize: Typography.fontSize.xl,
    fontWeight: 'bold',
    color: Colors.light.primary,
  },
  viewDetails: {
    fontSize: Typography.fontSize.sm,
    color: Colors.light.primary,
    fontWeight: '600',
  },
});

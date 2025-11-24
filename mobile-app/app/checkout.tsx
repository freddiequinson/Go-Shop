/**
 * Checkout Screen
 * Order checkout and payment
 */

import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { useCart } from '@/contexts/CartContext';
import orderService from '@/services/order.service';
import { Colors, Spacing, Typography, BorderRadius } from '@/constants/theme';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import CartItem from '@/components/cart/CartItem';

export default function CheckoutScreen() {
  const { items, totalPrice, clearCart } = useCart();
  const [loading, setLoading] = useState(false);

  const handlePlaceOrder = async () => {
    try {
      setLoading(true);
      
      // Create order
      const orderData = {
        items: items.map(item => ({
          product_id: item.product?.id,
          quantity: item.quantity,
        })),
        payment_method: 'cash', // Default for now
      };

      await orderService.createOrder(orderData);
      await clearCart();
      
      Alert.alert(
        'Order Placed!',
        'Your order has been placed successfully',
        [
          {
            text: 'View Orders',
            onPress: () => router.replace('/(tabs)/orders'),
          },
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to place order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const totalAmount = (totalPrice / 100).toFixed(2);

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={styles.header}>
        <Button
          title="← Back"
          onPress={() => router.back()}
          variant="ghost"
          size="sm"
        />
        <Text style={styles.title}>Checkout</Text>
        <View style={{ width: 80 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Order Items */}
        <Card>
          <Text style={styles.sectionTitle}>Order Items ({items.length})</Text>
          {items.map((item) => (
            <CartItem
              key={item.id}
              item={item}
            />
          ))}
        </Card>

        {/* Delivery Address */}
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Delivery Address</Text>
          <Text style={styles.addressText}>
            Default delivery address will be used
          </Text>
          <Button
            title="Change Address"
            onPress={() => Alert.alert('Coming Soon', 'Address management coming soon')}
            variant="outline"
            size="sm"
          />
        </Card>

        {/* Payment Method */}
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Method</Text>
          <View style={styles.paymentOption}>
            <Text style={styles.paymentIcon}>💵</Text>
            <Text style={styles.paymentText}>Cash on Delivery</Text>
          </View>
        </Card>

        {/* Order Summary */}
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Order Summary</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal:</Text>
            <Text style={styles.summaryValue}>GH₵ {totalAmount}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Delivery Fee:</Text>
            <Text style={styles.summaryValue}>GH₵ 0.00</Text>
          </View>
          <View style={[styles.summaryRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total:</Text>
            <Text style={styles.totalValue}>GH₵ {totalAmount}</Text>
          </View>
        </Card>
      </ScrollView>

      {/* Place Order Button */}
      <View style={styles.footer}>
        <Button
          title={loading ? 'Placing Order...' : 'Place Order'}
          onPress={handlePlaceOrder}
          loading={loading}
          fullWidth
          size="lg"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.lg,
    paddingTop: Spacing.xxl,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  title: {
    fontSize: Typography.fontSize.xl,
    fontWeight: 'bold',
    color: Colors.light.foreground,
  },
  content: {
    padding: Spacing.lg,
  },
  section: {
    marginTop: Spacing.md,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '600',
    color: Colors.light.foreground,
    marginBottom: Spacing.md,
  },
  addressText: {
    fontSize: Typography.fontSize.base,
    color: Colors.light.mutedForeground,
    marginBottom: Spacing.md,
  },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    backgroundColor: Colors.light.secondary,
    borderRadius: BorderRadius.md,
  },
  paymentIcon: {
    fontSize: 24,
    marginRight: Spacing.md,
  },
  paymentText: {
    fontSize: Typography.fontSize.base,
    fontWeight: '600',
    color: Colors.light.foreground,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  summaryLabel: {
    fontSize: Typography.fontSize.base,
    color: Colors.light.mutedForeground,
  },
  summaryValue: {
    fontSize: Typography.fontSize.base,
    fontWeight: '600',
    color: Colors.light.foreground,
  },
  totalRow: {
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
  },
  totalLabel: {
    fontSize: Typography.fontSize.lg,
    fontWeight: 'bold',
    color: Colors.light.foreground,
  },
  totalValue: {
    fontSize: Typography.fontSize.xl,
    fontWeight: 'bold',
    color: Colors.light.primary,
  },
  footer: {
    padding: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
    backgroundColor: Colors.light.background,
  },
});

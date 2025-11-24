/**
 * Cart Item Component
 * Displays cart item with quantity controls
 */

import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Colors, Spacing, Typography, BorderRadius } from '@/constants/theme';
import type { CartItem as CartItemType } from '@/types';

interface CartItemProps {
  item: CartItemType;
  onUpdateQuantity?: (quantity: number) => void;
  onRemove?: () => void;
}

export default function CartItem({ item, onUpdateQuantity, onRemove }: CartItemProps) {
  const price = (item.product.price_per_unit_cedis / 100).toFixed(2);
  const subtotal = ((item.product.price_per_unit_cedis * item.quantity) / 100).toFixed(2);

  const handleDecrease = () => {
    if (item.quantity > 1 && onUpdateQuantity) {
      onUpdateQuantity(item.quantity - 1);
    }
  };

  const handleIncrease = () => {
    if (onUpdateQuantity) {
      onUpdateQuantity(item.quantity + 1);
    }
  };

  return (
    <View style={styles.container}>
      {/* Product Image */}
      <View style={styles.imageContainer}>
        {item.product.image_url ? (
          <Image 
            source={{ uri: item.product.image_url }} 
            style={styles.image}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Text style={styles.imagePlaceholderText}>📦</Text>
          </View>
        )}
      </View>

      {/* Product Info */}
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={2}>
          {item.product.name}
        </Text>
        <Text style={styles.price}>GH₵ {price} / {item.product.unit_type}</Text>
        
        {/* Quantity Controls */}
        <View style={styles.quantityContainer}>
          <TouchableOpacity 
            style={[styles.quantityButton, item.quantity === 1 && styles.quantityButtonDisabled]}
            onPress={handleDecrease}
            disabled={item.quantity === 1}
          >
            <Text style={styles.quantityButtonText}>−</Text>
          </TouchableOpacity>
          
          <Text style={styles.quantity}>{item.quantity}</Text>
          
          <TouchableOpacity 
            style={styles.quantityButton}
            onPress={handleIncrease}
          >
            <Text style={styles.quantityButtonText}>+</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Subtotal and Remove */}
      <View style={styles.actions}>
        <Text style={styles.subtotal}>GH₵ {subtotal}</Text>
        {onRemove && (
          <TouchableOpacity 
            style={styles.removeButton}
            onPress={onRemove}
          >
            <Text style={styles.removeButtonText}>🗑️</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: Colors.light.card,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.light.border,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  imageContainer: {
    width: 80,
    height: 80,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    marginRight: Spacing.md,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: Colors.light.secondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePlaceholderText: {
    fontSize: 40,
  },
  info: {
    flex: 1,
    justifyContent: 'space-between',
  },
  name: {
    fontSize: Typography.fontSize.base,
    fontWeight: '600',
    color: Colors.light.foreground,
    marginBottom: Spacing.xs,
  },
  price: {
    fontSize: Typography.fontSize.sm,
    color: Colors.light.mutedForeground,
    marginBottom: Spacing.sm,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  quantityButton: {
    width: 28,
    height: 28,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.light.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  quantityButtonDisabled: {
    opacity: 0.5,
  },
  quantityButtonText: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '600',
    color: Colors.light.foreground,
  },
  quantity: {
    fontSize: Typography.fontSize.base,
    fontWeight: '600',
    color: Colors.light.foreground,
    minWidth: 30,
    textAlign: 'center',
  },
  actions: {
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginLeft: Spacing.sm,
  },
  subtotal: {
    fontSize: Typography.fontSize.lg,
    fontWeight: 'bold',
    color: Colors.light.primary,
  },
  removeButton: {
    padding: Spacing.xs,
  },
  removeButtonText: {
    fontSize: 20,
  },
});

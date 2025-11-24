/**
 * Product Card Component
 * Displays product information in a card format
 */

import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Colors, Spacing, Typography, BorderRadius } from '@/constants/theme';
import type { Product } from '@/types';
import Badge from '../ui/Badge';

interface ProductCardProps {
  product: Product;
  onPress?: () => void;
  onAddToCart?: () => void;
}

export default function ProductCard({ product, onPress, onAddToCart }: ProductCardProps) {
  const price = (product.price_per_unit_cedis / 100).toFixed(2);
  const isOutOfStock = product.quantity_available === 0;

  return (
    <TouchableOpacity 
      style={styles.card} 
      onPress={onPress}
      activeOpacity={0.7}
      disabled={!onPress}
    >
      {/* Product Image */}
      <View style={styles.imageContainer}>
        {product.image_url ? (
          <Image 
            source={{ uri: product.image_url }} 
            style={styles.image}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Text style={styles.imagePlaceholderText}>📦</Text>
          </View>
        )}
        
        {isOutOfStock && (
          <View style={styles.outOfStockBadge}>
            <Badge label="Out of Stock" variant="destructive" />
          </View>
        )}
      </View>

      {/* Product Info */}
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={2}>
          {product.name}
        </Text>
        
        {product.description && (
          <Text style={styles.description} numberOfLines={1}>
            {product.description}
          </Text>
        )}
        
        <View style={styles.footer}>
          <View>
            <Text style={styles.price}>GH₵ {price}</Text>
            <Text style={styles.unit}>per {product.unit_type}</Text>
          </View>
          
          {onAddToCart && !isOutOfStock && (
            <TouchableOpacity 
              style={styles.addButton}
              onPress={(e) => {
                e.stopPropagation();
                onAddToCart();
              }}
            >
              <Text style={styles.addButtonText}>Add</Text>
            </TouchableOpacity>
          )}
        </View>
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
    overflow: 'hidden',
    marginBottom: Spacing.md,
  },
  imageContainer: {
    width: '100%',
    height: 160,
    position: 'relative',
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
    fontSize: 60,
  },
  outOfStockBadge: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
  },
  info: {
    padding: Spacing.md,
  },
  name: {
    fontSize: Typography.fontSize.base,
    fontWeight: '600',
    color: Colors.light.foreground,
    marginBottom: Spacing.xs,
  },
  description: {
    fontSize: Typography.fontSize.sm,
    color: Colors.light.mutedForeground,
    marginBottom: Spacing.sm,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  price: {
    fontSize: Typography.fontSize.lg,
    fontWeight: 'bold',
    color: Colors.light.primary,
  },
  unit: {
    fontSize: Typography.fontSize.xs,
    color: Colors.light.mutedForeground,
  },
  addButton: {
    backgroundColor: Colors.light.primary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  addButtonText: {
    color: Colors.light.primaryForeground,
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
  },
});

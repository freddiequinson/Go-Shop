/**
 * Product Details Screen
 * Detailed view of a single product
 */

import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, Alert } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Colors, Spacing, Typography, BorderRadius } from '@/constants/theme';
import { useCart } from '@/contexts/CartContext';
import productService from '@/services/product.service';
import type { Product } from '@/types';
import Button from '@/components/ui/Button';
import Loading from '@/components/ui/Loading';
import Badge from '@/components/ui/Badge';

export default function ProductDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { addItem } = useCart();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [addingToCart, setAddingToCart] = useState(false);

  useEffect(() => {
    loadProduct();
  }, [id]);

  const loadProduct = async () => {
    try {
      setLoading(true);
      const data = await productService.getProductById(Number(id));
      setProduct(data);
    } catch (error) {
      console.error('Failed to load product:', error);
      Alert.alert('Error', 'Failed to load product details');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async () => {
    if (!product) return;

    try {
      setAddingToCart(true);
      await addItem(product.id, quantity);
      Alert.alert('Success', `Added ${quantity} ${product.unit_type}(s) to cart`);
    } catch (error) {
      Alert.alert('Error', 'Failed to add item to cart');
    } finally {
      setAddingToCart(false);
    }
  };

  const handleQuantityChange = (delta: number) => {
    const newQuantity = quantity + delta;
    if (newQuantity >= 1) {
      setQuantity(newQuantity);
    }
  };

  if (loading) {
    return <Loading text="Loading product..." />;
  }

  if (!product) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Product not found</Text>
        <Button title="Go Back" onPress={() => router.back()} />
      </View>
    );
  }

  const price = (product.price_per_unit_cedis / 100).toFixed(2);
  const isOutOfStock = product.quantity_available === 0;
  const totalPrice = ((product.price_per_unit_cedis * quantity) / 100).toFixed(2);

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      
      <ScrollView>
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
          
          {/* Back Button */}
          <Button
            title="← Back"
            onPress={() => router.back()}
            variant="ghost"
            size="sm"
            style={styles.backButton}
          />
        </View>

        {/* Product Info */}
        <View style={styles.content}>
          <View style={styles.header}>
            <View style={styles.titleContainer}>
              <Text style={styles.name}>{product.name}</Text>
              {isOutOfStock && (
                <Badge label="Out of Stock" variant="destructive" />
              )}
            </View>
            <Text style={styles.price}>GH₵ {price}</Text>
            <Text style={styles.unit}>per {product.unit_type}</Text>
          </View>

          {/* Description */}
          {product.description && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Description</Text>
              <Text style={styles.description}>{product.description}</Text>
            </View>
          )}

          {/* Product Details */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Details</Text>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Category:</Text>
              <Text style={styles.detailValue}>{product.category}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Available:</Text>
              <Text style={styles.detailValue}>
                {product.quantity_available} {product.unit_type}(s)
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Seller:</Text>
              <Text style={styles.detailValue}>
                {product.seller?.business_name || 'Go-Shop'}
              </Text>
            </View>
          </View>

          {/* Quantity Selector */}
          {!isOutOfStock && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Quantity</Text>
              <View style={styles.quantityContainer}>
                <Button
                  title="−"
                  onPress={() => handleQuantityChange(-1)}
                  variant="outline"
                  size="sm"
                  disabled={quantity === 1}
                />
                <Text style={styles.quantity}>{quantity}</Text>
                <Button
                  title="+"
                  onPress={() => handleQuantityChange(1)}
                  variant="outline"
                  size="sm"
                />
              </View>
              <Text style={styles.totalPrice}>
                Total: GH₵ {totalPrice}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Add to Cart Button */}
      {!isOutOfStock && (
        <View style={styles.footer}>
          <Button
            title={addingToCart ? 'Adding...' : 'Add to Cart'}
            onPress={handleAddToCart}
            loading={addingToCart}
            fullWidth
            size="lg"
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  imageContainer: {
    width: '100%',
    height: 300,
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
    fontSize: 100,
  },
  backButton: {
    position: 'absolute',
    top: Spacing.xxl,
    left: Spacing.md,
    backgroundColor: Colors.light.background,
    borderRadius: BorderRadius.full,
  },
  content: {
    padding: Spacing.lg,
  },
  header: {
    marginBottom: Spacing.xl,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.sm,
  },
  name: {
    flex: 1,
    fontSize: Typography.fontSize['2xl'],
    fontWeight: 'bold',
    color: Colors.light.foreground,
  },
  price: {
    fontSize: Typography.fontSize['3xl'],
    fontWeight: 'bold',
    color: Colors.light.primary,
    marginBottom: Spacing.xs,
  },
  unit: {
    fontSize: Typography.fontSize.base,
    color: Colors.light.mutedForeground,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '600',
    color: Colors.light.foreground,
    marginBottom: Spacing.md,
  },
  description: {
    fontSize: Typography.fontSize.base,
    color: Colors.light.foreground,
    lineHeight: 24,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  detailLabel: {
    fontSize: Typography.fontSize.base,
    color: Colors.light.mutedForeground,
  },
  detailValue: {
    fontSize: Typography.fontSize.base,
    fontWeight: '600',
    color: Colors.light.foreground,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.lg,
    marginBottom: Spacing.md,
  },
  quantity: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: 'bold',
    color: Colors.light.foreground,
    minWidth: 50,
    textAlign: 'center',
  },
  totalPrice: {
    fontSize: Typography.fontSize.xl,
    fontWeight: 'bold',
    color: Colors.light.primary,
    textAlign: 'center',
  },
  footer: {
    padding: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
    backgroundColor: Colors.light.background,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
    backgroundColor: Colors.light.background,
  },
  errorText: {
    fontSize: Typography.fontSize.xl,
    color: Colors.light.mutedForeground,
    marginBottom: Spacing.lg,
  },
});

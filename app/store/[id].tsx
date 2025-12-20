// app/store/[id].tsx - Premium Product Detail Screen
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions
} from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { GlassCard } from '../../src/components/ui/GlassCard';
import { GradientButton } from '../../src/components/ui/GradientButton';
import { SafeView } from '../../src/components/ui/SafeView';
import { colors } from '../../src/theme/colors';
import { gradients } from '../../src/theme/gradients';
import { borderRadius, spacing } from '../../src/theme/spacing';

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams();
  const { width } = useWindowDimensions();
  const [selectedSize, setSelectedSize] = useState('M');
  const [selectedColor, setSelectedColor] = useState('Black');

  // Mock Data
  const product = {
    id,
    name: 'Air Max Plus Comfort',
    price: 175,
    description: 'Experience ultimate comfort with the new Air Max Plus. Featuring responsive cushioning and breathable mesh for all-day wear.',
    rating: 4.8,
    reviews: 124,
    sizes: ['S', 'M', 'L', 'XL'],
    colors: [
      { name: 'Black', hex: '#000000' },
      { name: 'Teal', hex: '#14B8A6' },
      { name: 'White', hex: '#FFFFFF' },
    ],
    image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=2070&auto=format&fit=crop',
  };

  return (
    <SafeView gradient={gradients.backgroundDark}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Header Image Section */}
        <View style={[styles.imageContainer, { height: width * 0.8 }]}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <GlassCard style={styles.iconButton}>
              <Ionicons name="arrow-back" size={24} color={colors.text} />
            </GlassCard>
          </TouchableOpacity>

          <TouchableOpacity style={styles.wishlistButton}>
            <GlassCard style={styles.iconButton}>
              <Ionicons name="heart-outline" size={24} color={colors.text} />
            </GlassCard>
          </TouchableOpacity>

          <Animated.Image
            entering={FadeInDown.duration(800).springify()}
            source={{ uri: product.image }}
            style={styles.productImage}
          />
        </View>

        {/* Product Info Sheet */}
        <Animated.View
          entering={FadeInUp.duration(600).delay(200)}
          style={styles.contentContainer}
        >
          <View style={styles.headerRow}>
            <View style={styles.titleContainer}>
              <Text style={styles.productName}>{product.name}</Text>
              <View style={styles.ratingRow}>
                <Ionicons name="star" size={16} color={colors.warning} />
                <Text style={styles.ratingText}>{product.rating} ({product.reviews} reviews)</Text>
              </View>
            </View>
            <Text style={styles.price}>${product.price}</Text>
          </View>

          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.description}>{product.description}</Text>

          {/* Size Selector */}
          <Text style={styles.sectionTitle}>Select Size</Text>
          <View style={styles.optionsRow}>
            {product.sizes.map((size) => (
              <TouchableOpacity
                key={size}
                onPress={() => setSelectedSize(size)}
              >
                <GlassCard
                  style={[
                    styles.sizeOption,
                    selectedSize === size && styles.activeOption
                  ]}
                  intensity={selectedSize === size ? 40 : 10}
                >
                  <Text style={[
                    styles.sizeText,
                    selectedSize === size && styles.activeText
                  ]}>{size}</Text>
                </GlassCard>
              </TouchableOpacity>
            ))}
          </View>

          {/* Color Selector */}
          <Text style={styles.sectionTitle}>Select Color</Text>
          <View style={styles.optionsRow}>
            {product.colors.map((color) => (
              <TouchableOpacity
                key={color.name}
                onPress={() => setSelectedColor(color.name)}
                style={[
                  styles.colorWrapper,
                  selectedColor === color.name && styles.activeColorWrapper
                ]}
              >
                <View style={[styles.colorOption, { backgroundColor: color.hex }]} />
              </TouchableOpacity>
            ))}
          </View>

          <View style={{ height: 100 }} />
        </Animated.View>
      </ScrollView>

      {/* Bottom Action Bar */}
      <GlassCard style={styles.bottomBar}>
        <View style={styles.totalContainer}>
          <Text style={styles.totalLabel}>Total Price</Text>
          <Text style={styles.totalPrice}>${product.price}</Text>
        </View>
        <GradientButton
          title="Add to Cart"
          onPress={() => { }}
          style={styles.addButton}
          variant="primary"
        />
      </GlassCard>
    </SafeView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: 100,
  },
  imageContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  backButton: {
    position: 'absolute',
    top: spacing.md,
    left: spacing.lg,
    zIndex: 10,
  },
  wishlistButton: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.lg,
    zIndex: 10,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 0,
  },
  productImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
    transform: [{ rotate: '-15deg' }, { scale: 0.8 }],
  },
  contentContainer: {
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    borderTopLeftRadius: borderRadius.xxl,
    borderTopRightRadius: borderRadius.xxl,
    marginTop: -spacing.xxl,
    padding: spacing.xl,
    paddingTop: spacing.xxl,
    minHeight: 500,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.lg,
  },
  titleContainer: {
    flex: 1,
    marginRight: spacing.md,
  },
  productName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  ratingText: {
    color: colors.textMuted,
    fontSize: 14,
  },
  price: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.primaryLight,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.md,
    marginTop: spacing.md,
  },
  description: {
    color: colors.textMuted,
    fontSize: 16,
    lineHeight: 24,
  },
  optionsRow: {
    flexDirection: 'row',
    gap: spacing.md,
    flexWrap: 'wrap',
  },
  sizeOption: {
    width: 50,
    height: 50,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 0,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  activeOption: {
    borderColor: colors.primary,
    borderWidth: 2,
  },
  sizeText: {
    color: colors.textMuted,
    fontSize: 16,
    fontWeight: '600',
  },
  activeText: {
    color: colors.text,
  },
  colorWrapper: {
    padding: 4,
    borderRadius: borderRadius.full,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  activeColorWrapper: {
    borderColor: colors.primary,
  },
  colorOption: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.full,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing.lg,
    paddingBottom: spacing.xl,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
    borderRadius: 0,
  },
  totalContainer: {
    gap: 4,
  },
  totalLabel: {
    color: colors.textMuted,
    fontSize: 12,
  },
  totalPrice: {
    color: colors.text,
    fontSize: 24,
    fontWeight: 'bold',
  },
  addButton: {
    width: 160,
  },
});
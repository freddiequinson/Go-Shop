"use client"

import { useState, useRef, useEffect } from "react"
import { AddToCartModal } from "./add-to-cart-modal"

type Product = {
  id: number | string
  name: string
  price: number
  price_per_unit?: number | string
  price_per_quantity?: number | string
  unit_type?: string
  unit: string
  vendor: string
  image: string
}

type AddToCartWithAnimationProps = {
  product: Product
  isOpen: boolean
  onClose: () => void
  onAddToCart: (product: Product, quantity: number, purchaseType: "weight" | "quantity") => void
  productImageRef?: React.RefObject<HTMLImageElement>
}

export function AddToCartWithAnimation({
  product,
  isOpen,
  onClose,
  onAddToCart,
  productImageRef
}: AddToCartWithAnimationProps) {
  const modalImageRef = useRef<HTMLImageElement>(null)

  const handleAddToCart = async (product: Product, quantity: number, purchaseType: "weight" | "quantity") => {
    // Get the product image rect from modal
    const imageElement = modalImageRef.current || productImageRef?.current
    const cartButton = document.querySelector('.cart-button') as HTMLElement
    
    if (!imageElement || !cartButton) {
      // Fallback: just add to cart without animation
      onClose()
      onAddToCart(product, quantity, purchaseType)
      return
    }

    const productRect = imageElement.getBoundingClientRect()
    const cartRect = cartButton.getBoundingClientRect()

    // Calculate center points
    const cartCenter = {
      x: cartRect.left + cartRect.width / 2,
      y: cartRect.top + cartRect.height / 2
    }

    const productCenter = {
      x: productRect.left + productRect.width / 2,
      y: productRect.top + productRect.height / 2
    }

    // Calculate distance
    const distance = {
      x: cartCenter.x - productCenter.x,
      y: cartCenter.y - productCenter.y
    }

    // Close modal
    onClose()

    // Create animation element
    const element = Object.assign(document.createElement('div'), {
      className: 'cart-item',
      style: `
        --left: ${productRect.left}px;
        --top: ${productRect.top}px;
        --width: ${productRect.width}px;
        --height: ${productRect.height}px;
        --x: ${distance.x}px;
        --y: ${distance.y}px;
      `,
      innerHTML: `<img src="${product.image}" alt="${product.name}" />`
    })

    // Add to body
    document.body.appendChild(element)

    // Get animations
    const animations = element.getAnimations({ subtree: true })

    // Wait for animations to complete
    try {
      await Promise.all(animations.map(a => a.finished))
      
      // Bump cart
      bumpCart()
      
      // Remove element
      element.remove()
    } catch (error) {
      // Animation cancelled, clean up
      element.remove()
    }

    // Call the original onAddToCart
    onAddToCart(product, quantity, purchaseType)
  }

  return (
    <>
      <AddToCartModal
        product={product}
        isOpen={isOpen}
        onClose={onClose}
        onAddToCart={handleAddToCart}
      />

      {/* Hidden image ref for modal - positioned where modal image is */}
      {isOpen && (
        <div style={{ position: 'fixed', left: '50%', top: '50%', transform: 'translate(-50%, -50%)', zIndex: 60 }}>
          <img
            ref={modalImageRef}
            src={product.image}
            alt={product.name}
            style={{ width: '96px', height: '96px', objectFit: 'cover', borderRadius: '1rem', opacity: 0, pointerEvents: 'none' }}
          />
        </div>
      )}
    </>
  )
}

// Cart bump animation function
function bumpCart() {
  const cart = document.querySelector('.cart-button') as HTMLElement
  const badge = cart?.querySelector('.cart-badge, .badge') as HTMLElement
  
  if (!cart) return

  const ELASTIC_BOUNCE_EASING = 'cubic-bezier(.68,-0.55,.27,1.55)'
  const bumpSpeed = 400 // ms

  // Bump cart
  const cartAnimation = cart.animate([
    { transform: 'translateX(0) translateY(0) scale(1)' },
    { transform: 'translateX(10px) translateY(-10px) scale(1.1)', offset: 0.3 },
    { transform: 'translateX(0) translateY(0) scale(1)' }
  ], {
    duration: bumpSpeed,
    easing: ELASTIC_BOUNCE_EASING
  })

  // Bump badge if it exists
  if (badge) {
    badge.animate([
      { transform: 'scale(1)' },
      { transform: 'scale(0.7)', offset: 0.4 },
      { transform: 'scale(1.3)', offset: 0.6 },
      { transform: 'scale(1)' }
    ], {
      duration: bumpSpeed,
      easing: ELASTIC_BOUNCE_EASING
    })
  }
}

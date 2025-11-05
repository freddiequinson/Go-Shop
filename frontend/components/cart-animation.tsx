"use client"

import { useEffect, useRef } from 'react'

interface CartAnimationProps {
  triggerAnimation: boolean
  productImage: string
  productRect: DOMRect | null
  cartRect: DOMRect | null
  onAnimationComplete: () => void
}

export function CartAnimation({
  triggerAnimation,
  productImage,
  productRect,
  cartRect,
  onAnimationComplete
}: CartAnimationProps) {
  const animationRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!triggerAnimation || !productRect || !cartRect || !animationRef.current) return

    const element = animationRef.current

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

    // Set CSS variables
    element.style.setProperty('--left', `${productRect.left}px`)
    element.style.setProperty('--top', `${productRect.top}px`)
    element.style.setProperty('--width', `${productRect.width}px`)
    element.style.setProperty('--height', `${productRect.height}px`)
    element.style.setProperty('--x', `${distance.x}px`)
    element.style.setProperty('--y', `${distance.y}px`)

    // Get all animations
    const animations = element.getAnimations({ subtree: true })

    // Wait for animations to complete
    Promise.all(animations.map(a => a.finished)).then(() => {
      onAnimationComplete()
    })

    return () => {
      // Cleanup
      animations.forEach(a => a.cancel())
    }
  }, [triggerAnimation, productRect, cartRect, onAnimationComplete])

  if (!triggerAnimation) return null

  return (
    <div
      ref={animationRef}
      className="cart-item"
      style={{
        position: 'fixed',
        inset: 0,
        display: 'grid',
        placeItems: 'center',
        left: 'var(--left)',
        top: 'var(--top)',
        width: 'var(--width)',
        height: 'var(--height)',
        zIndex: 99999999999,
        animationName: 'cart-x, cart-y',
        animationDuration: 'var(--speed, 0.8s), var(--speed, 0.8s)',
        animationDelay: '0.1s, 0.1s',
        animationTimingFunction: 'var(--x-timing, cubic-bezier(.59,-0.75,.91,.5)), var(--y-timing, cubic-bezier(.15,.57,.9,1.05))',
        animationFillMode: 'both, both',
      }}
    >
      <img
        src={productImage}
        alt="Product"
        style={{
          width: '100%',
          aspectRatio: '1',
          objectFit: 'cover',
          animationName: 'cart-scale, cart-color',
          animationDuration: 'var(--speed, 0.8s), var(--speed, 0.8s)',
          animationDelay: '0.1s, 0.1s',
          animationTimingFunction: 'var(--scale-timing, cubic-bezier(.85,.06,.97,1.01)), var(--color-timing, cubic-bezier(.05,1.02,.97,1.01))',
          animationFillMode: 'both, both',
        }}
      />
    </div>
  )
}

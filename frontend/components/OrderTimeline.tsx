"use client"

import React, { useState, useEffect, Fragment, useRef } from 'react'
import Lottie from 'lottie-react'
import { CheckCircle, XCircle } from 'lucide-react'

// Import Lottie animations
import orderPlacedAnimation from '@/public/images/lottie/order-placed.json'
import paymentProcessingAnimation from '@/public/images/lottie/payment-processing.json'
import packingOrderAnimation from '@/public/images/lottie/packing-order.json'
import deliveryTruckAnimation from '@/public/images/lottie/delivery-truck.json'
import deliveredHomeAnimation from '@/public/images/lottie/delivered-home.json'

interface TimelineStep {
  label: string
  status: 'completed' | 'current' | 'pending' | 'failed'
  timestamp?: string
  animationData: any
}

interface OrderTimelineProps {
  orderStatus: string
  paymentStatus: string
  createdAt: string
  paymentCompletedAt?: string
  deliveredAt?: string
}

export default function OrderTimeline({ 
  orderStatus, 
  paymentStatus, 
  createdAt,
  paymentCompletedAt,
  deliveredAt 
}: OrderTimelineProps) {
  const [activeStep, setActiveStep] = useState(0)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Define timeline steps based on order status
  const getTimelineSteps = (): TimelineStep[] => {
    // Determine payment step status
    const paymentStepStatus = paymentStatus === 'completed' ? 'completed' : 
                              paymentStatus === 'failed' ? 'failed' : 'current'
    
    // Determine packing step status
    const packingStepStatus = orderStatus === 'confirmed' || orderStatus === 'dispatched' || orderStatus === 'delivered' ? 'completed' :
                              orderStatus === 'cancelled' ? 'failed' : 'pending'
    
    // Determine delivery step status
    const deliveryStepStatus = orderStatus === 'dispatched' || orderStatus === 'delivered' ? 'completed' :
                               orderStatus === 'cancelled' ? 'failed' : 'pending'
    
    // Determine delivered step status
    const deliveredStepStatus = orderStatus === 'delivered' ? 'completed' :
                                orderStatus === 'cancelled' ? 'failed' : 'pending'
    
    const steps: TimelineStep[] = [
      {
        label: 'Order Placed',
        status: 'completed',
        timestamp: createdAt,
        animationData: orderPlacedAnimation
      },
      {
        label: paymentStepStatus === 'completed' ? 'Payment Received' : 
               paymentStepStatus === 'failed' ? 'Payment Failed' : 'Payment Processing',
        status: paymentStepStatus,
        timestamp: paymentCompletedAt,
        animationData: paymentProcessingAnimation
      },
      {
        label: packingStepStatus === 'completed' ? 'Order Packaged' : 
               packingStepStatus === 'failed' ? 'Order Cancelled' : 'Packing Order',
        status: packingStepStatus,
        animationData: packingOrderAnimation
      },
      {
        label: deliveryStepStatus === 'completed' ? 'Out for Delivery' : 
               deliveryStepStatus === 'failed' ? 'Delivery Cancelled' : 'Awaiting Dispatch',
        status: deliveryStepStatus,
        animationData: deliveryTruckAnimation
      },
      {
        label: deliveredStepStatus === 'completed' ? 'Delivered' : 
               deliveredStepStatus === 'failed' ? 'Delivery Failed' : 'Pending Delivery',
        status: deliveredStepStatus,
        timestamp: deliveredAt,
        animationData: deliveredHomeAnimation
      }
    ]

    return steps
  }

  const steps = getTimelineSteps()

  // Animate canvas background
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width = canvas.offsetWidth
    canvas.height = canvas.offsetHeight

    let animationFrame: number
    let particles: Array<{ x: number; y: number; vx: number; vy: number; size: number }> = []

    // Create particles
    for (let i = 0; i < 30; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        size: Math.random() * 2 + 1
      })
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Update and draw particles
      particles.forEach(particle => {
        particle.x += particle.vx
        particle.y += particle.vy

        // Wrap around edges
        if (particle.x < 0) particle.x = canvas.width
        if (particle.x > canvas.width) particle.x = 0
        if (particle.y < 0) particle.y = canvas.height
        if (particle.y > canvas.height) particle.y = 0

        // Draw particle
        ctx.fillStyle = 'rgba(254, 209, 65, 0.3)'
        ctx.beginPath()
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2)
        ctx.fill()
      })

      // Draw connecting lines
      particles.forEach((p1, i) => {
        particles.slice(i + 1).forEach(p2 => {
          const dx = p1.x - p2.x
          const dy = p1.y - p2.y
          const distance = Math.sqrt(dx * dx + dy * dy)

          if (distance < 100) {
            ctx.strokeStyle = `rgba(254, 209, 65, ${0.2 * (1 - distance / 100)})`
            ctx.lineWidth = 0.5
            ctx.beginPath()
            ctx.moveTo(p1.x, p1.y)
            ctx.lineTo(p2.x, p2.y)
            ctx.stroke()
          }
        })
      })

      animationFrame = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      cancelAnimationFrame(animationFrame)
    }
  }, [])

  // Auto-advance active step animation
  useEffect(() => {
    const currentStepIndex = steps.findIndex(s => s.status === 'current')
    if (currentStepIndex !== -1) {
      setActiveStep(currentStepIndex)
    } else {
      const lastCompletedIndex = steps.findLastIndex(s => s.status === 'completed')
      setActiveStep(lastCompletedIndex !== -1 ? lastCompletedIndex : 0)
    }
  }, [orderStatus, paymentStatus])

  return (
    <div className="relative bg-gradient-to-br from-[#FED141]/10 to-[#303A4D]/5 rounded-2xl p-6 overflow-hidden">
      {/* Animated background canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        style={{ opacity: 0.4 }}
      />

      {/* Timeline content */}
      <div className="relative z-10">
        <h3 className="text-xl font-bold text-[#303A4D] mb-8 text-center">Getting Your Order To You</h3>

        {/* Horizontal Timeline */}
        <div className="relative flex items-start px-4">
          {steps.map((step, index) => {
            const isActive = index === activeStep
            const isCompleted = step.status === 'completed'
            const isFailed = step.status === 'failed'
            const isPending = step.status === 'pending'

            return (
              <Fragment key={index}>
                <div className="relative flex flex-col items-center flex-shrink-0">
                  {/* Lottie Animation */}
                  <div 
                    className={`relative z-10 flex items-center justify-center w-16 h-16 transition-all duration-500 ${
                      isCompleted ? 'scale-110' :
                      isFailed ? 'scale-110' :
                      isActive ? 'scale-125' :
                      'scale-100 opacity-50'
                    }`}
                  >
                    {isFailed ? (
                      <div className="w-12 h-12 rounded-full bg-red-500 flex items-center justify-center">
                        <XCircle className="w-6 h-6 text-white" />
                      </div>
                    ) : (
                      <Lottie
                        animationData={step.animationData}
                        loop={isActive}
                        autoplay={isCompleted || isActive}
                        style={{ width: 64, height: 64 }}
                      />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex flex-col items-center text-center mt-3 w-24">
                    <p className={`font-semibold text-xs transition-all duration-300 ${
                      isCompleted ? 'text-green-700' :
                      isFailed ? 'text-red-700' :
                      isActive ? 'text-[#303A4D] text-sm' :
                      'text-gray-500'
                    }`}>
                      {step.label}
                    </p>
                    {step.timestamp && (
                      <p className="text-xs text-gray-600 mt-1">
                        {new Date(step.timestamp).toLocaleString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    )}
                    {isFailed && (
                      <p className="text-xs text-red-600 mt-1">
                        ⚠️ Action required
                      </p>
                    )}
                    {isActive && !isFailed && !isCompleted && step.status === 'current' && (
                      <p className="text-xs text-[#303A4D] mt-1 animate-pulse">
                        ● In progress...
                      </p>
                    )}
                  </div>
                </div>

                {/* Connector line between steps */}
                {index < steps.length - 1 && (
                  <div className="flex items-start pt-6 flex-1 min-w-[40px] max-w-[120px]">
                    <div 
                      className={`w-full h-1 transition-all duration-500 ${
                        isCompleted ? 'bg-green-500' : 
                        isFailed ? 'bg-red-500' : 
                        'bg-gray-300'
                      }`}
                    />
                  </div>
                )}
              </Fragment>
            )
          })}
        </div>
      </div>
    </div>
  )
}

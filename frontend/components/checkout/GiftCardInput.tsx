"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { Gift, Loader2, X, Check } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface AppliedGiftCard {
  code: string
  amount: number
  balance: number
}

interface GiftCardInputProps {
  appliedCards: AppliedGiftCard[]
  onCardApply: (card: AppliedGiftCard) => void
  onCardRemove: (code: string) => void
  orderTotal: number
}

export default function GiftCardInput({
  appliedCards,
  onCardApply,
  onCardRemove,
  orderTotal,
}: GiftCardInputProps) {
  const { toast } = useToast()
  const [giftCardCode, setGiftCardCode] = useState('')
  const [isVerifying, setIsVerifying] = useState(false)

  const verifyGiftCard = async () => {
    if (!giftCardCode.trim()) {
      toast({
        title: 'Invalid Code',
        description: 'Please enter a gift card code',
        variant: 'destructive',
      })
      return
    }

    // Check if already applied
    if (appliedCards.some(card => card.code === giftCardCode)) {
      toast({
        title: 'Already Applied',
        description: 'This gift card has already been applied',
        variant: 'destructive',
      })
      return
    }

    setIsVerifying(true)
    try {
      // TODO: Call actual gift card verification API
      // const response = await giftcardsService.verify(giftCardCode)
      
      // Mock verification for now
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Mock gift card data
      const mockCard: AppliedGiftCard = {
        code: giftCardCode,
        amount: 50.00, // Amount to apply
        balance: 100.00, // Remaining balance
      }

      onCardApply(mockCard)
      setGiftCardCode('')
      
      toast({
        title: 'Gift Card Applied!',
        description: `GH₵${mockCard.amount.toFixed(2)} has been applied to your order`,
      })
    } catch (error: any) {
      toast({
        title: 'Invalid Gift Card',
        description: error.message || 'This gift card code is invalid or expired',
        variant: 'destructive',
      })
    } finally {
      setIsVerifying(false)
    }
  }

  const totalGiftCardAmount = appliedCards.reduce((sum, card) => sum + card.amount, 0)
  const remainingAmount = Math.max(0, orderTotal - totalGiftCardAmount)

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Gift className="w-5 h-5 text-[#303A4D]" />
        <h4 className="font-bold text-[#303A4D]">Gift Cards</h4>
      </div>

      {/* Gift Card Input */}
      <div className="space-y-2">
        <Label htmlFor="gift-card-code">Enter Gift Card Code</Label>
        <div className="flex gap-2">
          <Input
            id="gift-card-code"
            type="text"
            placeholder="XXXX-XXXX-XXXX"
            value={giftCardCode}
            onChange={(e) => setGiftCardCode(e.target.value.toUpperCase())}
            onKeyPress={(e) => e.key === 'Enter' && verifyGiftCard()}
            className="flex-1 uppercase"
            disabled={isVerifying}
          />
          <Button
            onClick={verifyGiftCard}
            disabled={isVerifying || !giftCardCode.trim()}
            className="bg-[#303A4D] hover:bg-[#3B4559]"
          >
            {isVerifying ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Verifying...
              </>
            ) : (
              'Apply'
            )}
          </Button>
        </div>
      </div>

      {/* Applied Gift Cards */}
      {appliedCards.length > 0 && (
        <div className="space-y-2">
          <Label>Applied Gift Cards</Label>
          {appliedCards.map((card) => (
            <Card key={card.code} className="p-4 bg-[#FED141]/10 border-2 border-[#FED141]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#FED141] flex items-center justify-center">
                    <Gift className="w-5 h-5 text-[#303A4D]" />
                  </div>
                  <div>
                    <p className="font-bold text-[#303A4D]">{card.code}</p>
                    <p className="text-sm text-gray-600">
                      Applied: GH₵{card.amount.toFixed(2)} • Balance: GH₵{card.balance.toFixed(2)}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onCardRemove(card.code)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Summary */}
      {appliedCards.length > 0 && (
        <div className="p-4 bg-green-50 border-2 border-green-200 rounded-xl space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-green-800">Total Gift Card Amount:</span>
            <span className="font-bold text-green-800">GH₵{totalGiftCardAmount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-green-800">Remaining to Pay:</span>
            <span className="font-bold text-green-800">GH₵{remainingAmount.toFixed(2)}</span>
          </div>
          {remainingAmount === 0 && (
            <div className="flex items-center gap-2 text-green-800 pt-2 border-t border-green-200">
              <Check className="w-4 h-4" />
              <span className="text-sm font-bold">Order fully covered by gift cards!</span>
            </div>
          )}
        </div>
      )}

      <p className="text-xs text-gray-600">
        💡 You can apply multiple gift cards to this order. The total amount will be deducted from your order.
      </p>
    </div>
  )
}

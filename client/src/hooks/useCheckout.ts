import { useMutation } from '@tanstack/react-query'
import { useToast } from '@/hooks/use-toast'

interface PaymentIntentResponse {
  clientSecret: string
  amount: number
}

export function useCheckout() {
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (): Promise<PaymentIntentResponse> => {
      const response = await fetch('/api/billing/create-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      })

      if (!response.ok) {
        throw new Error(`Checkout failed: ${response.statusText}`)
      }

      return response.json()
    },
    onSuccess: (data) => {
      toast({
        title: "Payment Intent Created",
        description: `Amount: $${(data.amount / 100).toFixed(2)}. Complete payment to proceed.`,
      })
    },
    onError: (error: any) => {
      console.error('Checkout error:', error)
      toast({
        title: "Checkout Failed",
        description: error.message || "Unable to start checkout process. Please try again.",
        variant: "destructive",
      })
    }
  })
}

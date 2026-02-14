import { useMutation } from '@tanstack/react-query'
import { apiRequest } from '@/lib/queryClient'
import { useToast } from '@/hooks/use-toast'

interface CheckoutResponse {
  url: string
}

export function useCheckout() {
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (): Promise<CheckoutResponse> => {
      const response = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          success_url: `${window.location.origin}/dashboard?checkout=success`,
          cancel_url: `${window.location.origin}/dashboard?checkout=cancelled`
        })
      })

      if (!response.ok) {
        throw new Error(`Checkout failed: ${response.statusText}`)
      }

      return response.json()
    },
    onSuccess: (data) => {
      // Redirect to Stripe checkout
      window.location.href = data.url
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
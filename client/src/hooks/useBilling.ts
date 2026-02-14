import { useQuery } from "@tanstack/react-query";

interface BillingUsage {
  analysesUsed: number;
  freeAnalysesUsed: number;
  freeAnalysesRemaining: number;
  canAnalyzeForFree: boolean;
}

export function useBilling() {
  const { data, isLoading, error } = useQuery<BillingUsage>({
    queryKey: ['/api/billing/usage'],
    staleTime: 30 * 1000, // 30 seconds
  });

  return {
    usage: data,
    isLoading,
    error,
  };
}
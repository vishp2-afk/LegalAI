import { useQuery } from "@tanstack/react-query";

interface Analysis {
  id: string;
  documentId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  summary?: any;
  risks?: any;
  highlights?: any;
  qaMessages?: any;
  isFree: boolean;
  amountCharged: string;
  createdAt: string;
  completedAt?: string;
}

interface Document {
  id: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  isPublic: boolean;
  createdAt: string;
}

interface AnalysisWithDocument extends Analysis {
  document?: Document;
}

export function useAnalyses() {
  const { data, isLoading, error, refetch } = useQuery<AnalysisWithDocument[]>({
    queryKey: ['/api/analyses'],
    staleTime: 30 * 1000, // 30 seconds
  });

  return {
    analyses: data || [],
    isLoading,
    error,
    refetch,
  };
}

export function useAnalysis(analysisId: string | null) {
  const { data, isLoading, error } = useQuery<Analysis>({
    queryKey: ['/api/analyses', analysisId],
    enabled: !!analysisId,
    staleTime: 10 * 1000, // 10 seconds
  });

  return {
    analysis: data,
    isLoading,
    error,
  };
}
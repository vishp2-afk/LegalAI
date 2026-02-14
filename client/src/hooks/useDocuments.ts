import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface Document {
  id: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  isPublic: boolean;
  createdAt: string;
}

export function useDocuments() {
  const { data, isLoading, error, refetch } = useQuery<Document[]>({
    queryKey: ['/api/documents'],
    staleTime: 30 * 1000, // 30 seconds
  });

  return {
    documents: data || [],
    isLoading,
    error,
    refetch,
  };
}

export function useUploadDocument() {
  return useMutation({
    mutationFn: async (file: File): Promise<Document> => {
      const formData = new FormData();
      formData.append('document', file);
      
      const response = await fetch('/api/documents/upload', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });
      
      if (!response.ok) {
        let errorMessage = 'Upload failed';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorData.message || errorMessage;
        } catch {
          // If JSON parsing fails, try text
          const errorText = await response.text();
          errorMessage = errorText || errorMessage;
        }
        throw new Error(errorMessage);
      }
      
      const data = await response.json();
      return data.document; // Extract document from {success: true, document: {...}}
    },
    onSuccess: () => {
      // Invalidate documents cache to refresh the list
      queryClient.invalidateQueries({ queryKey: ['/api/documents'] });
    },
  });
}

export function useAnalyzeDocument() {
  return useMutation({
    mutationFn: async ({ documentId, paymentIntentId }: { 
      documentId: string; 
      paymentIntentId?: string 
    }): Promise<{ success: boolean; analysisId: string; message: string }> => {
      const response = await apiRequest('POST', `/api/documents/${documentId}/analyze`, {
        paymentIntentId,
      });
      
      return response.json();
    },
    onSuccess: () => {
      // Invalidate analyses cache to refresh the list
      queryClient.invalidateQueries({ queryKey: ['/api/analyses'] });
      queryClient.invalidateQueries({ queryKey: ['/api/billing/usage'] });
    },
  });
}
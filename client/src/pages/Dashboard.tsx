import { useAuth } from "@/hooks/useAuth";
import { useBilling } from "@/hooks/useBilling";
import { useAnalyses } from "@/hooks/useAnalyses";
import { useUploadDocument, useAnalyzeDocument } from "@/hooks/useDocuments";
import { useCheckout } from "@/hooks/useCheckout";
import Header from "@/components/Header";
import DocumentUploader from "@/components/DocumentUploader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { formatDistanceToNow } from "date-fns";

export default function Dashboard() {
  const { user, isLoading: authLoading } = useAuth();
  const { usage, isLoading: billingLoading } = useBilling();
  const { analyses, isLoading: analysesLoading, refetch: refetchAnalyses } = useAnalyses();
  const uploadDocument = useUploadDocument();
  const analyzeDocument = useAnalyzeDocument();
  const checkout = useCheckout();
  const { toast } = useToast();
  const [uploadedDocumentId, setUploadedDocumentId] = useState<string | null>(null);

  const handleFileUpload = async (file: File) => {
    try {
      const document = await uploadDocument.mutateAsync(file);
      setUploadedDocumentId(document.id);
      toast({
        title: "Document uploaded successfully",
        description: `${file.name} is ready for analysis`,
      });
    } catch (error) {
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to upload document",
        variant: "destructive",
      });
    }
  };

  const handleAnalysisStart = async () => {
    if (!uploadedDocumentId) {
      toast({
        title: "No document selected",
        description: "Please upload a document first",
        variant: "destructive",
      });
      return;
    }

    try {
      const result = await analyzeDocument.mutateAsync({ documentId: uploadedDocumentId });
      toast({
        title: "Analysis started",
        description: "Your document is being analyzed. Results will appear below shortly.",
      });
      setUploadedDocumentId(null);
      refetchAnalyses();
    } catch (error) {
      toast({
        title: "Analysis failed",
        description: error instanceof Error ? error.message : "Failed to start analysis",
        variant: "destructive",
      });
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header showMenu={true} />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading your dashboard...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Header showMenu={false} />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
            <p className="text-muted-foreground mb-6">Please log in to access your dashboard.</p>
            <Button onClick={() => window.location.href = '/'}>
              Login
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const analysesUsed = usage?.freeAnalysesUsed || 0;
  const analysesRemaining = usage?.freeAnalysesRemaining || 0;
  const usagePercent = Math.min(100, (analysesUsed / 10) * 100);
  const canAnalyzeForFree = usage?.canAnalyzeForFree ?? true;

  return (
    <div className="min-h-screen bg-background">
      <Header showMenu={true} />
      
      <div className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">
            Welcome back, {user.firstName || 'User'}!
          </h1>
          <p className="text-muted-foreground">
            Upload and analyze your legal documents with AI-powered insights.
          </p>
        </div>

        {/* Usage Stats */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Usage This Month</CardTitle>
              <CardDescription>
                {billingLoading ? "Loading..." : `${analysesUsed} of 10 free analyses used`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {billingLoading ? (
                <div className="h-6 bg-muted animate-pulse rounded" />
              ) : (
                <>
                  <Progress value={usagePercent} className="mb-2" />
                  <p className="text-sm text-muted-foreground">
                    {analysesRemaining} analyses remaining
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Account Status</CardTitle>
              <CardDescription>Current plan details</CardDescription>
            </CardHeader>
            <CardContent>
              {billingLoading ? (
                <div className="h-6 bg-muted animate-pulse rounded w-20" />
              ) : (
                <>
                  <div className="flex items-center gap-2">
                    <Badge variant={canAnalyzeForFree ? "default" : "secondary"}>
                      {canAnalyzeForFree ? "Free Tier" : "Upgrade Needed"}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    {!canAnalyzeForFree ? 
                      "$10 per additional analysis" : 
                      "First 10 analyses are free"
                    }
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Privacy & Security</CardTitle>
              <CardDescription>Your data protection status</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm">End-to-end encrypted</span>
              </div>
              <p className="text-sm text-muted-foreground">
                All documents are private and secure
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Document Upload Section */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Upload Legal Document</CardTitle>
            <CardDescription>
              Drag and drop or select a legal document for AI analysis. 
              Supports PDF, DOC, DOCX, and TXT files up to 10MB.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DocumentUploader
              onFileUpload={handleFileUpload}
              onAnalysisStart={handleAnalysisStart}
              isUploading={uploadDocument.isPending}
              isAnalyzing={analyzeDocument.isPending}
              hasUploadedFile={!!uploadedDocumentId}
              canAnalyze={canAnalyzeForFree}
            />
            
            {!canAnalyzeForFree && !billingLoading && (
              <div className="mt-4 p-4 bg-muted rounded-lg">
                <h4 className="font-semibold mb-2">Upgrade to Continue</h4>
                <p className="text-sm text-muted-foreground mb-3">
                  You've used all 10 free analyses. Continue analyzing documents for $10 per analysis.
                </p>
                <Button 
                  size="sm" 
                  onClick={() => checkout.mutate()}
                  disabled={checkout.isPending}
                  data-testid="button-upgrade"
                >
                  {checkout.isPending ? 'Starting checkout...' : 'Upgrade Now'}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Analyses */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Analyses</CardTitle>
            <CardDescription>
              Your document analysis history and results
            </CardDescription>
          </CardHeader>
          <CardContent>
            {analysesLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-16 bg-muted animate-pulse rounded" />
                ))}
              </div>
            ) : analyses.length > 0 ? (
              <div className="space-y-3">
                {analyses.slice(0, 5).map((analysis) => (
                  <div key={analysis.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-medium">{analysis.document?.fileName || 'Unknown Document'}</h4>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>
                          Status: 
                          <Badge 
                            variant={analysis.status === 'completed' ? 'default' : 
                                    analysis.status === 'failed' ? 'destructive' : 'secondary'}
                            className="ml-1"
                          >
                            {analysis.status}
                          </Badge>
                        </span>
                        <span>{formatDistanceToNow(new Date(analysis.createdAt), { addSuffix: true })}</span>
                        <span>{analysis.isFree ? 'Free' : `$${analysis.amountCharged}`}</span>
                      </div>
                    </div>
                    {analysis.status === 'completed' && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => window.location.href = `/analysis/${analysis.id}`}
                        data-testid={`button-view-analysis-${analysis.id}`}
                      >
                        View Results
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <svg className="w-12 h-12 mx-auto mb-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p>No documents analyzed yet</p>
                <p className="text-sm">Upload your first legal document to get started</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
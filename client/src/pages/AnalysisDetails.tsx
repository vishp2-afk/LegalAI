import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, AlertTriangle, CheckCircle, Info } from "lucide-react";

interface AnalysisSummary {
  documentType: string;
  riskScore: number;
  totalClauses: number;
  completionStatus: string;
  keyFindings: string[];
  jurisdiction?: string;
  parties?: string[];
  effectiveDate?: string;
  termLength?: string;
  missingClauses?: string[];
  obligationsSummary?: string;
}

interface Analysis {
  id: string;
  documentId: string;
  status: string;
  summary: AnalysisSummary | null;
  risks: Array<{
    id: string;
    title: string;
    description: string;
    level: 'low' | 'medium' | 'high';
    clause: string;
    recommendation: string;
    impact: string;
    category?: string;
    negotiable?: boolean;
  }> | null;
  highlights: any[] | null;
  qaMessages: any[] | null;
  isFree: boolean;
  amountCharged: string;
  createdAt: string;
  document?: {
    fileName: string;
  } | null;
}

export default function AnalysisDetails() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { user, isLoading: authLoading } = useAuth();

  const { data: analysis, isLoading, error } = useQuery<Analysis>({
    queryKey: [`/api/analyses/${id}`],
    enabled: !!id && !!user,
    staleTime: 60 * 1000,
  });

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header showMenu={true} />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading analysis...</p>
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
            <p className="text-muted-foreground mb-6">Please log in to view analysis details.</p>
            <Button onClick={() => window.location.href = '/'}>
              Login
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (error || !analysis) {
    return (
      <div className="min-h-screen bg-background">
        <Header showMenu={true} />
        <div className="container mx-auto px-4 py-8">
          <Button 
            variant="ghost" 
            onClick={() => setLocation('/dashboard')}
            className="mb-6"
            data-testid="button-back"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Analysis Not Found</h1>
            <p className="text-muted-foreground">The requested analysis could not be found.</p>
          </div>
        </div>
      </div>
    );
  }

  const getRiskIcon = (level: string) => {
    switch (level) {
      case 'high':
        return <AlertTriangle className="w-5 h-5 text-destructive" />;
      case 'medium':
        return <Info className="w-5 h-5 text-yellow-600" />;
      case 'low':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      default:
        return <Info className="w-5 h-5" />;
    }
  };

  const getRiskBadgeVariant = (level: string): "destructive" | "default" | "secondary" => {
    switch (level) {
      case 'high':
        return 'destructive';
      case 'medium':
        return 'default';
      case 'low':
        return 'secondary';
      default:
        return 'default';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header showMenu={true} />
      
      <div className="container mx-auto px-4 py-8">
        <Button 
          variant="ghost" 
          onClick={() => setLocation('/dashboard')}
          className="mb-6"
          data-testid="button-back-to-dashboard"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>

        {/* Analysis Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold mb-2">Analysis Results</h1>
              <p className="text-muted-foreground">
                {analysis.document?.fileName || 'Document Analysis'}
              </p>
            </div>
            <Badge 
              variant={analysis.status === 'completed' ? 'default' : 'secondary'}
              data-testid="badge-status"
            >
              {analysis.status}
            </Badge>
          </div>
        </div>

        {/* Summary Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Document Summary</CardTitle>
            <CardDescription>AI-generated analysis overview</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-6 mb-6">
              <div>
                <div className="text-sm text-muted-foreground mb-1">Document Type</div>
                <div className="font-semibold" data-testid="text-document-type">
                  {analysis.summary?.documentType || 'Unknown'}
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground mb-1">Risk Score</div>
                <div className="font-semibold" data-testid="text-risk-score">
                  {analysis.summary?.riskScore ?? 0}/100
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground mb-1">Analysis Date</div>
                <div className="font-semibold">
                  {new Date(analysis.createdAt).toLocaleDateString()}
                </div>
              </div>
            </div>

            {analysis.summary?.obligationsSummary && (
              <div>
                <div className="text-sm font-semibold mb-2">Obligations Summary</div>
                <p className="text-muted-foreground">{analysis.summary.obligationsSummary}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Key Findings */}
        {analysis.summary?.keyFindings && analysis.summary.keyFindings.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Key Findings</CardTitle>
              <CardDescription>Important observations from the analysis</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {analysis.summary!.keyFindings.map((finding, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                    <span>{finding}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Risks */}
        {analysis.risks && analysis.risks.length > 0 && analysis.status === 'completed' && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">Identified Risks</h2>
            {analysis.risks.map((risk) => (
              <Card key={risk.id}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      {getRiskIcon(risk.level)}
                      <div>
                        <CardTitle className="text-xl">{risk.title}</CardTitle>
                        <CardDescription className="mt-1">{risk.description}</CardDescription>
                      </div>
                    </div>
                    <Badge variant={getRiskBadgeVariant(risk.level)}>
                      {risk.level.toUpperCase()}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {risk.clause && (
                    <div>
                      <div className="text-sm font-semibold mb-2">Relevant Clause</div>
                      <div className="p-3 bg-muted rounded-lg text-sm italic">
                        "{risk.clause}"
                      </div>
                    </div>
                  )}
                  
                  {risk.recommendation && (
                    <div>
                      <div className="text-sm font-semibold mb-2">Recommendation</div>
                      <p className="text-sm text-muted-foreground">{risk.recommendation}</p>
                    </div>
                  )}
                  
                  {risk.impact && (
                    <div>
                      <div className="text-sm font-semibold mb-2">Potential Impact</div>
                      <p className="text-sm text-muted-foreground">{risk.impact}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
import { useState } from 'react'
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { FileText, AlertTriangle, CheckCircle, Clock, Scale } from 'lucide-react'
import DocumentViewer, { DocumentHighlight } from './DocumentViewer'
import RiskAssessmentCard, { RiskItem } from './RiskAssessmentCard'
import InteractiveQA, { QAMessage } from './InteractiveQA'

export interface AnalysisSummary {
  documentType: string
  totalClauses: number
  riskScore: number
  completionStatus: 'analyzing' | 'completed' | 'needs-input'
  keyFindings: string[]
}

interface AnalysisDashboardProps {
  fileName: string
  documentContent: string
  summary: AnalysisSummary
  risks: RiskItem[]
  highlights: DocumentHighlight[]
  qaMessages: QAMessage[]
  onRiskAction?: (riskId: string, action: 'view' | 'apply') => void
  onQAInteraction?: (type: 'message' | 'suggestion', content: string) => void
}

export default function AnalysisDashboard({
  fileName,
  documentContent,
  summary,
  risks,
  highlights,
  qaMessages,
  onRiskAction,
  onQAInteraction
}: AnalysisDashboardProps) {
  const [selectedRisk, setSelectedRisk] = useState<string | null>(null)

  const getRiskCounts = () => {
    return risks.reduce(
      (acc, risk) => {
        acc[risk.level]++
        return acc
      },
      { high: 0, medium: 0, low: 0 }
    )
  }

  const riskCounts = getRiskCounts()
  const totalRisks = risks.length

  const getRiskScoreColor = (score: number) => {
    if (score >= 70) return 'text-chart-4'
    if (score >= 40) return 'text-chart-3'
    return 'text-chart-2'
  }

  const getStatusIcon = (status: AnalysisSummary['completionStatus']) => {
    switch (status) {
      case 'analyzing':
        return <Clock className="w-4 h-4 text-chart-3" />
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-chart-2" />
      case 'needs-input':
        return <AlertTriangle className="w-4 h-4 text-chart-4" />
    }
  }

  const handleRiskView = (riskId: string) => {
    setSelectedRisk(riskId)
    onRiskAction?.(riskId, 'view')
  }

  const handleRiskApply = (riskId: string) => {
    onRiskAction?.(riskId, 'apply')
  }

  return (
    <div className="h-screen flex flex-col">
      <ResizablePanelGroup direction="horizontal" className="flex-1">
        {/* Document Viewer */}
        <ResizablePanel defaultSize={60} minSize={40}>
          <div className="h-full p-4 pr-2">
            <DocumentViewer
              fileName={fileName}
              content={documentContent}
              highlights={highlights}
              onHighlightClick={(highlight) => {
                const risk = risks.find(r => r.id === highlight.id)
                if (risk) {
                  setSelectedRisk(risk.id)
                }
                console.log('Highlight clicked:', highlight.id)
              }}
            />
          </div>
        </ResizablePanel>

        <ResizableHandle />

        {/* Analysis Panel */}
        <ResizablePanel defaultSize={40} minSize={30}>
          <div className="h-full p-4 pl-2">
            <Tabs defaultValue="overview" className="h-full flex flex-col">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="overview" data-testid="tab-overview">Overview</TabsTrigger>
                <TabsTrigger value="risks" data-testid="tab-risks">
                  Risks ({totalRisks})
                </TabsTrigger>
                <TabsTrigger value="chat" data-testid="tab-chat">Q&A</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="flex-1 mt-4">
                <ScrollArea className="h-full">
                  <div className="space-y-4">
                    {/* Analysis Summary */}
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2">
                          <Scale className="w-5 h-5" />
                          Analysis Summary
                          {getStatusIcon(summary.completionStatus)}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">Document Type</p>
                            <p className="font-medium">{summary.documentType}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Total Clauses</p>
                            <p className="font-medium">{summary.totalClauses}</p>
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between text-sm mb-2">
                            <span className="text-muted-foreground">Risk Score</span>
                            <span className={`font-bold ${getRiskScoreColor(summary.riskScore)}`}>
                              {summary.riskScore}/100
                            </span>
                          </div>
                          <Progress value={summary.riskScore} className="h-2" />
                        </div>

                        <div>
                          <p className="text-sm text-muted-foreground mb-2">Key Findings</p>
                          <ul className="text-sm space-y-1">
                            {summary.keyFindings.map((finding, index) => (
                              <li key={index} className="flex items-start gap-2">
                                <FileText className="w-3 h-3 mt-0.5 text-muted-foreground flex-shrink-0" />
                                {finding}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Risk Overview */}
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle>Risk Breakdown</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-3 gap-4 text-center">
                          <div>
                            <div className="text-2xl font-bold text-chart-4">{riskCounts.high}</div>
                            <div className="text-xs text-muted-foreground">High Risk</div>
                          </div>
                          <div>
                            <div className="text-2xl font-bold text-chart-3">{riskCounts.medium}</div>
                            <div className="text-xs text-muted-foreground">Medium Risk</div>
                          </div>
                          <div>
                            <div className="text-2xl font-bold text-chart-2">{riskCounts.low}</div>
                            <div className="text-xs text-muted-foreground">Low Risk</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="risks" className="flex-1 mt-4">
                <ScrollArea className="h-full">
                  <div className="space-y-3">
                    {risks.map((risk) => (
                      <RiskAssessmentCard
                        key={risk.id}
                        risk={risk}
                        onViewClause={handleRiskView}
                        onApplyRecommendation={handleRiskApply}
                      />
                    ))}
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="chat" className="flex-1 mt-4">
                <InteractiveQA
                  messages={qaMessages}
                  onSendMessage={(message) => onQAInteraction?.('message', message)}
                  onSelectSuggestion={(suggestion) => onQAInteraction?.('suggestion', suggestion)}
                  isLoading={summary.completionStatus === 'analyzing'}
                />
              </TabsContent>
            </Tabs>
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  )
}
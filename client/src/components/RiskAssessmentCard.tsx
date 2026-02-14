import { AlertTriangle, Shield, AlertCircle, ChevronRight } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { useState } from 'react'

export type RiskLevel = 'low' | 'medium' | 'high'

export interface RiskItem {
  id: string
  title: string
  description: string
  level: RiskLevel
  clause: string
  recommendation: string
  impact: string
}

interface RiskAssessmentCardProps {
  risk: RiskItem
  onViewClause?: (clauseId: string) => void
  onApplyRecommendation?: (riskId: string) => void
}

const riskConfig = {
  low: {
    color: 'bg-chart-2/10 text-chart-2 border-chart-2/20',
    icon: Shield,
    label: 'Low Risk'
  },
  medium: {
    color: 'bg-chart-3/10 text-chart-3 border-chart-3/20',
    icon: AlertCircle,
    label: 'Medium Risk'
  },
  high: {
    color: 'bg-chart-4/10 text-chart-4 border-chart-4/20',
    icon: AlertTriangle,
    label: 'High Risk'
  }
}

export default function RiskAssessmentCard({ 
  risk, 
  onViewClause, 
  onApplyRecommendation 
}: RiskAssessmentCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const config = riskConfig[risk.level]
  const Icon = config.icon

  const handleViewClause = () => {
    onViewClause?.(risk.id)
    console.log('Viewing clause for risk:', risk.id)
  }

  const handleApplyRecommendation = () => {
    onApplyRecommendation?.(risk.id)
    console.log('Applying recommendation for risk:', risk.id)
  }

  return (
    <Card className="hover-elevate" data-testid={`risk-card-${risk.id}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <Icon className="w-5 h-5 mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <CardTitle className="text-base leading-tight">{risk.title}</CardTitle>
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                {risk.description}
              </p>
            </div>
          </div>
          <Badge 
            className={`${config.color} flex-shrink-0`}
            data-testid={`badge-risk-${risk.level}`}
          >
            {config.label}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
          <CollapsibleTrigger asChild>
            <Button 
              variant="ghost" 
              size="sm"
              className="w-full justify-between p-2 h-auto"
              data-testid="button-expand-risk"
            >
              <span className="text-sm font-medium">
                {isExpanded ? 'Hide Details' : 'View Details'}
              </span>
              <ChevronRight 
                className={`w-4 h-4 transition-transform ${
                  isExpanded ? 'rotate-90' : ''
                }`} 
              />
            </Button>
          </CollapsibleTrigger>
          
          <CollapsibleContent className="space-y-4 pt-3">
            <div className="space-y-3 text-sm">
              <div>
                <h4 className="font-medium mb-1">Problematic Clause</h4>
                <p className="text-muted-foreground bg-muted/50 p-3 rounded-md">
                  "{risk.clause}"
                </p>
              </div>
              
              <div>
                <h4 className="font-medium mb-1">Potential Impact</h4>
                <p className="text-muted-foreground">{risk.impact}</p>
              </div>
              
              <div>
                <h4 className="font-medium mb-1">Recommendation</h4>
                <p className="text-muted-foreground">{risk.recommendation}</p>
              </div>
            </div>
            
            <div className="flex gap-2 pt-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleViewClause}
                data-testid="button-view-clause"
              >
                View in Document
              </Button>
              <Button 
                size="sm"
                onClick={handleApplyRecommendation}
                data-testid="button-apply-fix"
              >
                Apply Fix
              </Button>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  )
}
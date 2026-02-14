import AnalysisDashboard from '../AnalysisDashboard'

export default function AnalysisDashboardExample() {
  // todo: remove mock functionality
  const mockContent = `EMPLOYMENT AGREEMENT

This Employment Agreement ("Agreement") is entered into on [DATE], by and between [COMPANY NAME], a [STATE] corporation ("Company"), and [EMPLOYEE NAME] ("Employee").

1. EMPLOYMENT RELATIONSHIP
The Company hereby employs the Employee, and the Employee accepts employment with the Company, subject to the terms and conditions set forth in this Agreement.

2. POSITION AND DUTIES  
Employee shall serve as [POSITION TITLE] and shall perform such duties as are customarily associated with such position, as well as such other duties as may be assigned from time to time by the Company.

3. COMPENSATION
The Company agrees to pay Employee a base salary of $[AMOUNT] per year, payable in accordance with the Company's standard payroll practices.

4. LIABILITY
The Service Provider shall be liable for any and all damages, losses, or expenses arising from or related to the services provided hereunder, without limitation.

5. TERMINATION
Either party may terminate this agreement at any time for any reason.

6. CONFIDENTIALITY
All confidential information disclosed shall remain confidential for 3 years post-termination.`

  const mockSummary = {
    documentType: 'Employment Agreement',
    totalClauses: 15,
    riskScore: 68,
    completionStatus: 'completed' as const,
    keyFindings: [
      'Contains unlimited liability clause (high risk)',
      'Termination terms lack specific notice requirements',
      'Confidentiality period is standard at 3 years',
      'No non-compete clause present',
      'Compensation structure is clearly defined'
    ]
  }

  const mockRisks = [
    {
      id: 'liability-clause',
      title: 'Unlimited Liability Clause',
      description: 'Contract includes unlimited liability which could expose you to significant financial risk.',
      level: 'high' as const,
      clause: 'The Service Provider shall be liable for any and all damages, losses, or expenses arising from or related to the services provided hereunder, without limitation.',
      recommendation: 'Add a liability cap clause limiting damages to the contract value or a specific dollar amount.',
      impact: 'Could result in unlimited financial exposure for damages beyond your control or reasonable expectations.'
    },
    {
      id: 'termination-clause',
      title: 'Vague Termination Terms',
      description: 'Termination clause lacks specific notice requirements and grounds for termination.',
      level: 'medium' as const,
      clause: 'Either party may terminate this agreement at any time for any reason.',
      recommendation: 'Specify minimum notice periods (e.g., 30 days) and clear grounds for immediate termination.',
      impact: 'May lead to unexpected contract termination without adequate time to find alternatives.'
    },
    {
      id: 'confidentiality-clause',
      title: 'Standard Confidentiality',
      description: 'Confidentiality clause appears standard and adequately protects sensitive information.',
      level: 'low' as const,
      clause: 'All confidential information disclosed shall remain confidential for 3 years post-termination.',
      recommendation: 'Consider extending confidentiality period to 5 years for highly sensitive information.',
      impact: 'Low risk - standard protection with minor enhancement opportunity.'
    }
  ]

  const mockHighlights = [
    {
      id: 'liability-clause',
      startIndex: mockContent.indexOf('The Service Provider shall be liable'),
      endIndex: mockContent.indexOf('without limitation.') + 'without limitation.'.length,
      type: 'risk-high' as const,
      note: 'Unlimited liability clause - high risk'
    },
    {
      id: 'termination-clause',
      startIndex: mockContent.indexOf('Either party may terminate'),
      endIndex: mockContent.indexOf('for any reason.') + 'for any reason.'.length,
      type: 'risk-medium' as const,
      note: 'Vague termination terms'
    },
    {
      id: 'confidentiality-clause',
      startIndex: mockContent.indexOf('All confidential information'),
      endIndex: mockContent.indexOf('3 years post-termination.') + '3 years post-termination.'.length,
      type: 'risk-low' as const,
      note: 'Standard confidentiality clause'
    }
  ]

  const mockMessages = [
    {
      id: '1',
      type: 'question' as const,
      content: 'I\'ve completed the analysis of your employment contract. I found some concerning liability terms. Are you planning to work as an employee or independent contractor?',
      timestamp: new Date(),
      suggestions: ['Employee', 'Independent Contractor', 'Not sure']
    },
    {
      id: '2',
      type: 'answer' as const,
      content: 'Employee',
      timestamp: new Date()
    },
    {
      id: '3',
      type: 'question' as const,
      content: 'As an employee, the unlimited liability clause is particularly concerning since you\'ll have less control over business decisions. Would you like me to draft alternative language that limits your liability?',
      timestamp: new Date(),
      suggestions: ['Yes, draft alternatives', 'Explain the risks first', 'Skip this issue']
    }
  ]

  return (
    <div className="bg-background">
      <AnalysisDashboard
        fileName="Employment_Agreement.pdf"
        documentContent={mockContent}
        summary={mockSummary}
        risks={mockRisks}
        highlights={mockHighlights}
        qaMessages={mockMessages}
        onRiskAction={(riskId, action) => console.log('Risk action:', riskId, action)}
        onQAInteraction={(type, content) => console.log('QA interaction:', type, content)}
      />
    </div>
  )
}
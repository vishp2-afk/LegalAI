import RiskAssessmentCard from '../RiskAssessmentCard'

export default function RiskAssessmentCardExample() {
  // todo: remove mock functionality
  const mockRisks = [
    {
      id: '1',
      title: 'Unlimited Liability Clause',
      description: 'Contract includes unlimited liability which could expose you to significant financial risk.',
      level: 'high' as const,
      clause: 'The Service Provider shall be liable for any and all damages, losses, or expenses arising from or related to the services provided hereunder, without limitation.',
      recommendation: 'Add a liability cap clause limiting damages to the contract value or a specific dollar amount.',
      impact: 'Could result in unlimited financial exposure for damages beyond your control or reasonable expectations.'
    },
    {
      id: '2',
      title: 'Vague Termination Terms',
      description: 'Termination clause lacks specific notice requirements and grounds for termination.',
      level: 'medium' as const,
      clause: 'Either party may terminate this agreement at any time for any reason.',
      recommendation: 'Specify minimum notice periods (e.g., 30 days) and clear grounds for immediate termination.',
      impact: 'May lead to unexpected contract termination without adequate time to find alternatives.'
    },
    {
      id: '3',
      title: 'Standard Confidentiality',
      description: 'Confidentiality clause appears standard and adequately protects sensitive information.',
      level: 'low' as const,
      clause: 'All confidential information disclosed shall remain confidential for 3 years post-termination.',
      recommendation: 'Consider extending confidentiality period to 5 years for highly sensitive information.',
      impact: 'Low risk - standard protection with minor enhancement opportunity.'
    }
  ]

  return (
    <div className="p-8 bg-background min-h-screen space-y-4">
      <h2 className="text-2xl font-bold mb-6">Risk Assessment Cards</h2>
      {mockRisks.map(risk => (
        <RiskAssessmentCard
          key={risk.id}
          risk={risk}
          onViewClause={(id) => console.log('View clause for risk:', id)}
          onApplyRecommendation={(id) => console.log('Apply recommendation for risk:', id)}
        />
      ))}
    </div>
  )
}
import DocumentViewer from '../DocumentViewer'

export default function DocumentViewerExample() {
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

  return (
    <div className="p-8 bg-background h-screen">
      <DocumentViewer
        fileName="Employment_Agreement.pdf"
        content={mockContent}
        highlights={mockHighlights}
        onHighlightClick={(highlight) => console.log('Clicked highlight:', highlight.id)}
      />
    </div>
  )
}
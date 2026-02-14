import InteractiveQA from '../InteractiveQA'

export default function InteractiveQAExample() {
  // todo: remove mock functionality  
  const mockMessages = [
    {
      id: '1',
      type: 'question' as const,
      content: 'I\'ve analyzed your employment contract. To provide better guidance, could you tell me what type of role this is for?',
      timestamp: new Date(),
      suggestions: ['Full-time employee', 'Contractor', 'Consultant', 'Part-time']
    },
    {
      id: '2',
      type: 'answer' as const,
      content: 'Full-time employee',
      timestamp: new Date()
    },
    {
      id: '3',
      type: 'question' as const,
      content: 'Great! I notice the contract has an unlimited liability clause. What\'s your primary concern - are you more worried about financial protection or the ability to terminate the contract if needed?',
      timestamp: new Date(),
      suggestions: ['Financial protection', 'Contract flexibility', 'Both equally']
    }
  ]

  return (
    <div className="p-8 bg-background h-screen">
      <div className="max-w-2xl mx-auto h-full">
        <InteractiveQA
          messages={mockMessages}
          onSendMessage={(message) => console.log('New message:', message)}
          onSelectSuggestion={(suggestion) => console.log('Selected:', suggestion)}
          isLoading={false}
        />
      </div>
    </div>
  )
}
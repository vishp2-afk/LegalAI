import { useState } from 'react'
import { Send, Bot, User } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

export interface QAMessage {
  id: string
  type: 'question' | 'answer'
  content: string
  timestamp: Date
  suggestions?: string[]
}

interface InteractiveQAProps {
  messages?: QAMessage[]
  onSendMessage?: (message: string) => void
  onSelectSuggestion?: (suggestion: string) => void
  isLoading?: boolean
}

export default function InteractiveQA({ 
  messages = [], 
  onSendMessage,
  onSelectSuggestion,
  isLoading = false
}: InteractiveQAProps) {
  const [inputValue, setInputValue] = useState('')

  const handleSendMessage = () => {
    if (inputValue.trim()) {
      onSendMessage?.(inputValue.trim())
      console.log('Sending message:', inputValue.trim())
      setInputValue('')
    }
  }

  const handleSelectSuggestion = (suggestion: string) => {
    onSelectSuggestion?.(suggestion)
    console.log('Selected suggestion:', suggestion)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  return (
    <Card className="flex flex-col h-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Bot className="w-5 h-5" />
          Legal AI Assistant
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          I'll ask questions to better understand your needs and provide tailored advice
        </p>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col min-h-0">
        <ScrollArea className="flex-1 pr-3" data-testid="qa-messages">
          <div className="space-y-4">
            {messages.map((message) => (
              <div key={message.id} className="space-y-3">
                <div className={`flex gap-3 ${message.type === 'answer' ? '' : 'flex-row-reverse'}`}>
                  <Avatar className="w-8 h-8 flex-shrink-0">
                    <AvatarFallback className={message.type === 'question' ? 'bg-primary text-primary-foreground' : 'bg-muted'}>
                      {message.type === 'question' ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className={`flex-1 max-w-[80%] ${message.type === 'answer' ? 'text-right' : ''}`}>
                    <div className={`p-3 rounded-lg ${
                      message.type === 'question' 
                        ? 'bg-primary text-primary-foreground' 
                        : 'bg-muted'
                    }`}>
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    </div>
                    
                    {message.suggestions && message.suggestions.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {message.suggestions.map((suggestion, index) => (
                          <Button
                            key={index}
                            variant="outline"
                            size="sm"
                            className="text-xs h-7"
                            onClick={() => handleSelectSuggestion(suggestion)}
                            data-testid={`button-suggestion-${index}`}
                          >
                            {suggestion}
                          </Button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex gap-3">
                <Avatar className="w-8 h-8">
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    <Bot className="w-4 h-4" />
                  </AvatarFallback>
                </Avatar>
                <div className="bg-primary text-primary-foreground p-3 rounded-lg">
                  <p className="text-sm">Thinking...</p>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="pt-4 border-t">
          <div className="flex gap-2">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your response..."
              disabled={isLoading}
              className="flex-1"
              data-testid="input-message"
            />
            <Button 
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isLoading}
              size="icon"
              data-testid="button-send-message"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
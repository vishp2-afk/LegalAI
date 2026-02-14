import { useState } from 'react'
import { ZoomIn, ZoomOut, RotateCcw, Download, Highlighter } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'

export interface DocumentHighlight {
  id: string
  startIndex: number
  endIndex: number
  type: 'risk-high' | 'risk-medium' | 'risk-low' | 'suggestion'
  note?: string
}

interface DocumentViewerProps {
  fileName: string
  content: string
  highlights?: DocumentHighlight[]
  onHighlightClick?: (highlight: DocumentHighlight) => void
}

const highlightStyles = {
  'risk-high': 'bg-chart-4/20 border-l-2 border-chart-4',
  'risk-medium': 'bg-chart-3/20 border-l-2 border-chart-3', 
  'risk-low': 'bg-chart-2/20 border-l-2 border-chart-2',
  'suggestion': 'bg-primary/10 border-l-2 border-primary'
}

export default function DocumentViewer({ 
  fileName, 
  content, 
  highlights = [],
  onHighlightClick 
}: DocumentViewerProps) {
  const [zoom, setZoom] = useState(100)
  const [showHighlights, setShowHighlights] = useState(true)

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 25, 200))
    console.log('Zoom in:', zoom + 25)
  }

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 25, 50))
    console.log('Zoom out:', zoom - 25)
  }

  const handleReset = () => {
    setZoom(100)
    console.log('Reset zoom to 100%')
  }

  const handleDownload = () => {
    console.log('Download document:', fileName)
  }

  const toggleHighlights = () => {
    setShowHighlights(prev => !prev)
    console.log('Toggle highlights:', !showHighlights)
  }

  // Simple text highlighting - in real app would use more sophisticated parsing
  const renderContentWithHighlights = () => {
    if (!showHighlights || highlights.length === 0) {
      return <div className="whitespace-pre-wrap leading-relaxed">{content}</div>
    }

    let lastIndex = 0
    const elements: React.ReactNode[] = []
    
    // Sort highlights by start index
    const sortedHighlights = [...highlights].sort((a, b) => a.startIndex - b.startIndex)
    
    sortedHighlights.forEach((highlight, i) => {
      // Add text before highlight
      if (highlight.startIndex > lastIndex) {
        elements.push(
          <span key={`text-${i}`}>
            {content.slice(lastIndex, highlight.startIndex)}
          </span>
        )
      }
      
      // Add highlighted text
      const highlightedText = content.slice(highlight.startIndex, highlight.endIndex)
      elements.push(
        <span
          key={`highlight-${highlight.id}`}
          className={`${highlightStyles[highlight.type]} px-1 py-0.5 rounded cursor-pointer hover-elevate`}
          onClick={() => onHighlightClick?.(highlight)}
          title={highlight.note}
          data-testid={`highlight-${highlight.id}`}
        >
          {highlightedText}
        </span>
      )
      
      lastIndex = highlight.endIndex
    })
    
    // Add remaining text
    if (lastIndex < content.length) {
      elements.push(
        <span key="text-end">
          {content.slice(lastIndex)}
        </span>
      )
    }
    
    return <div className="whitespace-pre-wrap leading-relaxed">{elements}</div>
  }

  return (
    <Card className="flex flex-col h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold truncate" data-testid="text-document-name">
              {fileName}
            </h3>
            <p className="text-sm text-muted-foreground">
              Document Preview
            </p>
          </div>
          
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              onClick={handleZoomOut}
              disabled={zoom <= 50}
              data-testid="button-zoom-out"
            >
              <ZoomOut className="w-4 h-4" />
            </Button>
            
            <span className="text-sm font-mono px-2 min-w-[60px] text-center">
              {zoom}%
            </span>
            
            <Button
              variant="outline"
              size="icon"
              onClick={handleZoomIn}
              disabled={zoom >= 200}
              data-testid="button-zoom-in"
            >
              <ZoomIn className="w-4 h-4" />
            </Button>
            
            <Separator orientation="vertical" className="h-6 mx-1" />
            
            <Button
              variant="outline"
              size="icon"
              onClick={handleReset}
              data-testid="button-reset-zoom"
            >
              <RotateCcw className="w-4 h-4" />
            </Button>
            
            <Button
              variant={showHighlights ? "default" : "outline"}
              size="icon"
              onClick={toggleHighlights}
              data-testid="button-toggle-highlights"
            >
              <Highlighter className="w-4 h-4" />
            </Button>
            
            <Button
              variant="outline"
              size="icon"
              onClick={handleDownload}
              data-testid="button-download"
            >
              <Download className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 min-h-0">
        <ScrollArea className="h-full">
          <div 
            className="p-4 bg-card rounded border font-mono text-sm"
            style={{ 
              fontSize: `${zoom}%`,
              lineHeight: zoom > 125 ? '1.4' : '1.6'
            }}
            data-testid="document-content"
          >
            {renderContentWithHighlights()}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
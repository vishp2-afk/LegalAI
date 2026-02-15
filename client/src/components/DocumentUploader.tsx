import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, FileText, File, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

interface DocumentUploaderProps {
  onFileUpload?: (file: File) => void
  onAnalysisStart?: () => void
  isUploading?: boolean
  isAnalyzing?: boolean
  hasUploadedFile?: boolean
  canAnalyze?: boolean
}

export default function DocumentUploader({ 
  onFileUpload, 
  onAnalysisStart, 
  isUploading = false,
  isAnalyzing = false,
  hasUploadedFile = false,
  canAnalyze = true
}: DocumentUploaderProps) {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)

  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: any[]) => {
    setError(null)
    
    if (rejectedFiles.length > 0) {
      setError('Please upload only PDF, DOC, DOCX, or TXT files under 10MB')
      return
    }

    const file = acceptedFiles[0]
    if (file) {
      setUploadedFile(file)
      setError(null)
      onFileUpload?.(file)
    }
  }, [onFileUpload])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt']
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024 // 10MB
  })

  const getFileIcon = (fileName: string) => {
    const ext = fileName.toLowerCase().split('.').pop()
    return ext === 'pdf' ? <FileText className="w-8 h-8" /> : <File className="w-8 h-8" />
  }

  const handleStartAnalysis = () => {
    onAnalysisStart?.()
  }

  const formatFileSize = (bytes: number) => {
    return bytes < 1024 * 1024 
      ? `${Math.round(bytes / 1024)} KB`
      : `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-foreground">Legal Document Analysis</h1>
        <p className="text-muted-foreground">Upload your legal document for AI-powered analysis and risk assessment</p>
      </div>

      {!hasUploadedFile && !uploadedFile ? (
        <Card className="p-8">
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors ${
              isDragActive 
                ? 'border-primary bg-primary/5' 
                : 'border-border hover:border-primary/50 hover:bg-muted/50'
            }`}
            data-testid="document-upload-zone"
          >
            <input {...getInputProps()} data-testid="file-input" />
            <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            
            {isDragActive ? (
              <p className="text-lg font-medium text-primary">Drop your document here</p>
            ) : (
              <>
                <p className="text-lg font-medium mb-2">Drag & drop your legal document</p>
                <p className="text-muted-foreground mb-4">or click to browse files</p>
                <Button variant="outline" data-testid="button-browse">
                  Choose File
                </Button>
              </>
            )}
            
            <div className="mt-6 text-sm text-muted-foreground">
              <p>Supported formats: PDF, DOC, DOCX, TXT</p>
              <p>Maximum file size: 10MB</p>
            </div>
          </div>
          
          {error && (
            <div className="mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}
        </Card>
      ) : (
        <Card className="p-6 bg-green-50 border-green-200">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center">
              <div className="w-8 h-8 text-green-600">
                {uploadedFile ? getFileIcon(uploadedFile.name) : <FileText className="w-8 h-8" />}
              </div>
            </div>
            
            <div>
              <h3 className="font-semibold text-green-800 mb-1">
                {isAnalyzing ? 'Analysis in progress...' : 
                 isUploading ? 'Uploading...' : 
                 'File ready for analysis!'}
              </h3>
              <p className="text-green-600 font-medium">
                {uploadedFile?.name || 'Document uploaded successfully'}
              </p>
              {uploadedFile && (
                <p className="text-sm text-green-500">{formatFileSize(uploadedFile.size)}</p>
              )}
            </div>
            
            {isUploading && (
              <div className="space-y-2">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600 mx-auto"></div>
                <p className="text-sm text-green-600">Uploading...</p>
              </div>
            )}

            {isAnalyzing ? (
              <div className="space-y-3">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
                <p className="text-sm text-green-600">Analyzing document with AI...</p>
              </div>
            ) : !isUploading && (
              <Button 
                onClick={handleStartAnalysis}
                className="bg-green-600 hover:bg-green-700"
                data-testid="button-start-analysis"
                disabled={isAnalyzing || isUploading || !canAnalyze}
              >
                {!canAnalyze ? 'Upgrade Required' : 'Start Analysis'}
              </Button>
            )}
          </div>
        </Card>
      )}
    </div>
  )
}
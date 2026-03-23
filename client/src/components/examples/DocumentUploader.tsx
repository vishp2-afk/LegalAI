import DocumentUploader from '../DocumentUploader'

export default function DocumentUploaderExample() {
  return (
    <div className="p-8 bg-background min-h-screen">
      <DocumentUploader 
        onFileUpload={(file) => console.log('File uploaded:', file.name)}
        onAnalysisStart={() => console.log('Analysis started')}
      />
    </div>
  )
}
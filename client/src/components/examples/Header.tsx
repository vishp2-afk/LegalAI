import Header from '../Header'
import { ThemeProvider } from 'next-themes'

export default function HeaderExample() {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <div className="bg-background min-h-screen">
        <Header 
          showMenu={true}
          onMenuClick={() => console.log('Menu clicked')} 
        />
        <div className="p-8">
          <h2 className="text-xl font-semibold mb-4">Header Example</h2>
          <p className="text-muted-foreground">
            This header includes the LegalAI branding, theme toggle, and user menu.
            Try toggling between light and dark themes.
          </p>
        </div>
      </div>
    </ThemeProvider>
  )
}
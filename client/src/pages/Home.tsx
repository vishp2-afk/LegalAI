import { useAuth } from '@/hooks/useAuth'
import Header from '@/components/Header'
import { Button } from '@/components/ui/button'
import { ArrowRight, Shield, Zap, FileText, Users, Star } from 'lucide-react'
import heroImage from '@assets/generated_images/Legal_tech_hero_image_12d08c73.png'

export default function Home() {
  const { isAuthenticated, isLoading } = useAuth()

  // Redirect authenticated users to dashboard
  if (isAuthenticated && !isLoading) {
    window.location.href = '/dashboard'
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      <Header showMenu={false} />
      
      {/* Hero Section */}
      <section className="relative py-20 overflow-hidden">
        <div className="container mx-auto px-4 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="space-y-4">
                <h1 className="text-4xl md:text-6xl font-bold text-foreground leading-tight">
                  AI-Powered
                  <span className="block text-primary">Legal Document</span>
                  Analysis
                </h1>
                <p className="text-xl text-muted-foreground leading-relaxed">
                  Get instant AI insights into your legal documents. Identify risks, 
                  understand complex clauses, and make informed decisions with confidence.
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  size="lg" 
                  className="text-lg px-8 py-4"
                  onClick={() => window.location.href = '/api/login'}
                  data-testid="button-get-started"
                >
                  Get Started Free
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
                <Button 
                  variant="outline" 
                  size="lg" 
                  className="text-lg px-8 py-4"
                  data-testid="button-learn-more"
                >
                  Learn More
                </Button>
              </div>
              
              <div className="flex items-center gap-6 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  <span>End-to-end encrypted</span>
                </div>
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4" />
                  <span>10 free analyses</span>
                </div>
              </div>
            </div>
            
            <div className="relative">
              <img 
                src={heroImage} 
                alt="Legal Document Analysis Platform" 
                className="w-full rounded-2xl shadow-2xl"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Why Choose LegalReviewer AI?
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Advanced AI technology makes legal document analysis accessible, 
              fast, and reliable for everyone.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto">
                <Zap className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">Instant Analysis</h3>
              <p className="text-muted-foreground">
                Get comprehensive legal document analysis in seconds, not hours. 
                Our AI reviews every clause and identifies potential issues.
              </p>
            </div>
            
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto">
                <Shield className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">Bank-Level Security</h3>
              <p className="text-muted-foreground">
                Your documents are encrypted and never stored permanently. 
                Complete privacy and confidentiality guaranteed.
              </p>
            </div>
            
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto">
                <FileText className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">Expert Insights</h3>
              <p className="text-muted-foreground">
                Receive detailed explanations, risk assessments, and actionable 
                recommendations from our legal AI assistant.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-xl text-muted-foreground">
              Start free, pay only when you need more
            </p>
          </div>
          
          <div className="max-w-lg mx-auto">
            <div className="bg-card border rounded-2xl p-8 text-center">
              <div className="space-y-4">
                <h3 className="text-2xl font-bold">Free Tier</h3>
                <div className="space-y-2">
                  <div className="text-4xl font-bold">10</div>
                  <div className="text-muted-foreground">free analyses per month</div>
                </div>
                <ul className="space-y-3 text-left">
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-primary rounded-full"></div>
                    <span>Complete document analysis</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-primary rounded-full"></div>
                    <span>Risk assessment & highlights</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-primary rounded-full"></div>
                    <span>Interactive Q&A assistant</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-primary rounded-full"></div>
                    <span>End-to-end encryption</span>
                  </li>
                </ul>
                <div className="pt-4">
                  <Button 
                    size="lg" 
                    className="w-full"
                    onClick={() => window.location.href = '/api/login'}
                    data-testid="button-start-free"
                  >
                    Start Free
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  Additional analyses: $10 each
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-2xl mx-auto space-y-6">
            <h2 className="text-3xl md:text-4xl font-bold">
              Ready to Get Started?
            </h2>
            <p className="text-xl opacity-90">
              Join thousands of users who trust LegalReviewer AI 
              for their document analysis needs.
            </p>
            <Button 
              size="lg" 
              variant="secondary"
              className="text-lg px-8 py-4"
              onClick={() => window.location.href = '/api/login'}
              data-testid="button-sign-up"
            >
              Sign Up Free
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <FileText className="w-6 h-6 text-primary" />
              <span className="text-xl font-bold">LegalReviewer AI</span>
            </div>
            <p className="text-muted-foreground">
              Powered by advanced AI • Built for privacy • Trusted by professionals
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
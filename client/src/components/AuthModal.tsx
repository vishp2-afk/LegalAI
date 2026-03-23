import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/hooks/use-toast'
import { queryClient } from '@/lib/queryClient'
import { FcGoogle } from 'react-icons/fc'

interface AuthModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultTab?: 'login' | 'register'
}

interface LoginFormData {
  email: string
  password: string
}

interface RegisterFormData {
  firstName: string
  lastName: string
  email: string
  password: string
  confirmPassword: string
}

export default function AuthModal({ open, onOpenChange, defaultTab = 'login' }: AuthModalProps) {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)

  const loginForm = useForm<LoginFormData>()
  const registerForm = useForm<RegisterFormData>()

  const handleLogin = async (data: LoginFormData) => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.message)
      }
      await queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] })
      onOpenChange(false)
    } catch (err: any) {
      toast({ title: 'Login failed', description: err.message, variant: 'destructive' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleRegister = async (data: RegisterFormData) => {
    if (data.password !== data.confirmPassword) {
      registerForm.setError('confirmPassword', { message: 'Passwords do not match' })
      return
    }
    setIsLoading(true)
    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.message)
      }
      await queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] })
      onOpenChange(false)
    } catch (err: any) {
      toast({ title: 'Registration failed', description: err.message, variant: 'destructive' })
    } finally {
      setIsLoading(false)
    }
  }

  const googleEnabled = !!(import.meta.env.VITE_GOOGLE_AUTH_ENABLED !== 'false')

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Welcome to LegalAI</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue={defaultTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Sign In</TabsTrigger>
            <TabsTrigger value="register">Create Account</TabsTrigger>
          </TabsList>

          {/* Sign In Tab */}
          <TabsContent value="login" className="space-y-4 mt-4">
            <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="login-email">Email</Label>
                <Input
                  id="login-email"
                  type="email"
                  placeholder="you@example.com"
                  {...loginForm.register('email', { required: true })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="login-password">Password</Label>
                <Input
                  id="login-password"
                  type="password"
                  placeholder="••••••••"
                  {...loginForm.register('password', { required: true })}
                />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Or</span>
              </div>
            </div>

            <Button
              variant="outline"
              className="w-full"
              type="button"
              onClick={() => (window.location.href = '/api/auth/google')}
            >
              <FcGoogle className="mr-2 h-4 w-4" />
              Continue with Google
            </Button>
          </TabsContent>

          {/* Create Account Tab */}
          <TabsContent value="register" className="space-y-4 mt-4">
            <form onSubmit={registerForm.handleSubmit(handleRegister)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    placeholder="John"
                    {...registerForm.register('firstName')}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    placeholder="Doe"
                    {...registerForm.register('lastName')}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="register-email">Email</Label>
                <Input
                  id="register-email"
                  type="email"
                  placeholder="you@example.com"
                  {...registerForm.register('email', { required: true })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="register-password">Password</Label>
                <Input
                  id="register-password"
                  type="password"
                  placeholder="Min. 8 characters"
                  {...registerForm.register('password', { required: true, minLength: 8 })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  {...registerForm.register('confirmPassword', { required: true })}
                />
                {registerForm.formState.errors.confirmPassword && (
                  <p className="text-sm text-destructive">
                    {registerForm.formState.errors.confirmPassword.message}
                  </p>
                )}
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Creating account...' : 'Create Account'}
              </Button>
            </form>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Or</span>
              </div>
            </div>

            <Button
              variant="outline"
              className="w-full"
              type="button"
              onClick={() => (window.location.href = '/api/auth/google')}
            >
              <FcGoogle className="mr-2 h-4 w-4" />
              Sign up with Google
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import useAuthStore from '@/stores/useAuthStore'
import useDataStore from '@/stores/useDataStore'
import { useNavigate } from 'react-router-dom'
import { Home } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

export default function Login() {
  const { login, setProfileLevel, setRole } = useAuthStore()
  const { db } = useDataStore()
  const navigate = useNavigate()
  const { toast } = useToast()

  const [email, setEmail] = useState('')

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()

    const foundUser = db.users.find((u) => u.email.toLowerCase() === email.toLowerCase())

    if (foundUser) {
      if (foundUser.isActive === false) {
        toast({
          title: 'Acesso Negado',
          description: 'Sua conta está desativada. Entre em contato com o administrador.',
          variant: 'destructive',
        })
        return
      }
      setProfileLevel(foundUser.profileLevel || 'Colaborador')
      setRole(foundUser.role)
      login(foundUser.id)
    } else {
      // Simulate a successful login with a default profile if email is not found
      setProfileLevel('Diretor')
      setRole('Administrador')
      login('u1')
    }

    navigate('/', { replace: true })

    toast({
      title: 'Login realizado com sucesso',
      description: 'Bem-vindo de volta à plataforma.',
    })
  }

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-background p-4 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-3xl opacity-50 pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-secondary/10 rounded-full blur-3xl opacity-50 pointer-events-none" />

      <Card className="w-full max-w-md shadow-xl border-border/60 z-10 bg-card/80 backdrop-blur-sm">
        <CardHeader className="space-y-4 items-center text-center pb-8 pt-8">
          <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center shadow-inner">
            <Home className="h-8 w-8 text-primary-foreground" />
          </div>
          <div className="space-y-2">
            <CardTitle className="text-3xl font-bold tracking-tight text-foreground">
              AlugAI
            </CardTitle>
            <CardDescription className="text-base text-muted-foreground">
              Gestão inteligente de locações
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4 animate-fade-in-up">
            <div className="space-y-2">
              <label className="text-sm font-medium leading-none text-foreground">Email</label>
              <Input
                type="email"
                placeholder="seu@email.com.br"
                className="h-12 bg-background"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium leading-none text-foreground">Senha</label>
                <a href="#" className="text-sm font-medium text-primary hover:underline">
                  Recuperar senha
                </a>
              </div>
              <Input
                type="password"
                placeholder="••••••••"
                className="h-12 bg-background"
                required
              />
            </div>

            <Button type="submit" className="w-full h-12 text-base mt-6">
              Entrar na plataforma
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="mt-8 text-center text-sm text-muted-foreground z-10">
        &copy; {new Date().getFullYear()} AlugAI SaaS. Todos os direitos reservados.
      </div>
    </div>
  )
}

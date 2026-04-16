import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import useAuthStore from '@/stores/useAuthStore'
import { useNavigate } from 'react-router-dom'
import { Home, Loader2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

export default function Login() {
  const { login, resetPassword } = useAuthStore()
  const navigate = useNavigate()
  const { toast } = useToast()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isResetting, setIsResetting] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    const { error } = await login(email, password)
    if (error) {
      toast({ title: 'Erro no login', description: error === 'Invalid login credentials' ? 'Email ou senha incorretos.' : error, variant: 'destructive' })
      setIsLoading(false)
      return
    }
    toast({ title: 'Login realizado com sucesso', description: 'Bem-vindo de volta.' })
    navigate('/', { replace: true })
  }

  const handleResetPassword = async (e: React.MouseEvent) => {
    e.preventDefault()
    if (!email) { toast({ title: 'Informe o email', description: 'Digite seu email acima para recuperar a senha.', variant: 'destructive' }); return }
    setIsResetting(true)
    const { error } = await resetPassword(email)
    setIsResetting(false)
    if (error) { toast({ title: 'Erro', description: error, variant: 'destructive' }); return }
    toast({ title: 'Email enviado', description: 'Verifique sua caixa de entrada.' })
  }

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-background p-4 relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-3xl opacity-50 pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-secondary/10 rounded-full blur-3xl opacity-50 pointer-events-none" />
      <Card className="w-full max-w-md shadow-xl border-border/60 z-10 bg-card/80 backdrop-blur-sm">
        <CardHeader className="space-y-4 items-center text-center pb-8 pt-8">
          <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center shadow-inner">
            <Home className="h-8 w-8 text-primary-foreground" />
          </div>
          <div className="space-y-2">
            <CardTitle className="text-3xl font-bold tracking-tight text-foreground">AlugAI</CardTitle>
            <CardDescription className="text-base text-muted-foreground">Gest\u00e3o inteligente de loca\u00e7\u00f5es</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4 animate-fade-in-up">
            <div className="space-y-2">
              <label className="text-sm font-medium leading-none text-foreground">Email</label>
              <Input type="email" placeholder="seu@email.com.br" className="h-12 bg-background" value={email} onChange={(e) => setEmail(e.target.value)} required disabled={isLoading} />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium leading-none text-foreground">Senha</label>
                <button type="button" onClick={handleResetPassword} className="text-sm font-medium text-primary hover:underline disabled:opacity-50" disabled={isResetting}>
                  {isResetting ? 'Enviando...' : 'Recuperar senha'}
                </button>
              </div>
              <Input type="password" placeholder="\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022" className="h-12 bg-background" value={password} onChange={(e) => setPassword(e.target.value)} required disabled={isLoading} />
            </div>
            <Button type="submit" className="w-full h-12 text-base mt-6" disabled={isLoading}>
              {isLoading ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" />Entrando...</>) : 'Entrar na plataforma'}
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

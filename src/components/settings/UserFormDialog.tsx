import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import useDataStore from '@/stores/useDataStore'
import { User, UserRole, UserProfileLevel } from '@/types'

interface Props {
  open: boolean
  onClose: () => void
  user: User | null
}

const rolesList: UserRole[] = [
  'Administrador',
  'Gestor',
  'Colaborador',
  'Equipe de Vistoria',
  'Equipe Administrativa',
  'Equipe Financeira',
  'Equipe Comercial',
  'Concierge',
]

const profileLevels: UserProfileLevel[] = ['Colaborador', 'Gestor', 'Diretor']

export function UserFormDialog({ open, onClose, user }: Props) {
  const { db, addUser, updateUser } = useDataStore()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<UserRole>('Colaborador')
  const [profileLevel, setProfileLevel] = useState<UserProfileLevel>('Colaborador')
  const [accessProfileId, setAccessProfileId] = useState<string>('none')
  const [isActive, setIsActive] = useState<boolean>(true)

  useEffect(() => {
    if (user) {
      setName(user.name)
      setEmail(user.email)
      setRole(user.role)
      setProfileLevel(user.profileLevel || 'Colaborador')
      setAccessProfileId(user.accessProfileId || 'none')
      setIsActive(user.isActive !== false)
    } else {
      setName('')
      setEmail('')
      setRole('Colaborador')
      setProfileLevel('Colaborador')
      setAccessProfileId('none')
      setIsActive(true)
    }
  }, [user, open])

  const handleSave = () => {
    if (!name.trim() || !email.trim()) return

    const payload = {
      name,
      email,
      role,
      profileLevel,
      isActive,
      accessProfileId:
        role === 'Administrador'
          ? undefined
          : accessProfileId === 'none'
            ? undefined
            : accessProfileId,
      avatar:
        user?.avatar ||
        `https://img.usecurling.com/ppl/thumbnail?seed=${Math.floor(Math.random() * 100)}`,
    }

    if (user) {
      updateUser(user.id, payload)
    } else {
      addUser(payload)
    }
    onClose()
  }

  const isAdmin = role === 'Administrador'

  return (
    <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle>{user ? 'Editar Usuário' : 'Novo Usuário'}</DialogTitle>
          <DialogDescription>
            Defina os dados principais do membro da equipe e associe os níveis de acesso adequados.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          <div className="flex items-center justify-between rounded-lg border p-4 bg-muted/20">
            <div className="space-y-0.5">
              <Label className="text-base">Acesso do Usuário</Label>
              <p className="text-sm text-muted-foreground">
                Habilite ou desative o acesso deste usuário à plataforma.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Label htmlFor="active-status" className="font-medium text-sm w-12 text-right">
                {isActive ? 'Ativo' : 'Inativo'}
              </Label>
              <Switch checked={isActive} onCheckedChange={setIsActive} id="active-status" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Nome Completo</Label>
            <Input
              id="name"
              placeholder="Ex: João da Silva"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              type="email"
              placeholder="joao@alugai.com.br"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Cargo/Função</Label>
              <Select value={role} onValueChange={(v) => setRole(v as UserRole)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {rolesList.map((r) => (
                    <SelectItem key={r} value={r}>
                      {r}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Nível no Sistema</Label>
              <Select
                value={profileLevel}
                onValueChange={(v) => setProfileLevel(v as UserProfileLevel)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {profileLevels.map((pl) => (
                    <SelectItem key={pl} value={pl}>
                      {pl}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Perfil de Acesso (RBAC)</Label>
            <Select
              value={isAdmin ? 'admin-bypass' : accessProfileId}
              onValueChange={setAccessProfileId}
              disabled={isAdmin}
            >
              <SelectTrigger className={isAdmin ? 'bg-muted opacity-50' : ''}>
                <SelectValue placeholder="Selecione um perfil" />
              </SelectTrigger>
              <SelectContent>
                {isAdmin && <SelectItem value="admin-bypass">Administrador (Total)</SelectItem>}
                <SelectItem value="none">Nenhum (Restrito)</SelectItem>
                {db.accessProfiles.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {isAdmin && (
              <p className="text-xs text-muted-foreground mt-1">
                Administradores possuem acesso total a todos os módulos independente de perfis.
              </p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={!name.trim() || !email.trim()}>
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

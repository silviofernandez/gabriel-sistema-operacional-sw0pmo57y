import { useState } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Edit2, Plus, ShieldAlert } from 'lucide-react'
import useDataStore from '@/stores/useDataStore'
import { UserFormDialog } from './UserFormDialog'
import { User } from '@/types'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'

export function UsersTab() {
  const { db, updateUser } = useDataStore()
  const { toast } = useToast()
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false)

  const handleEdit = (u: User) => {
    setSelectedUser(u)
    setIsDialogOpen(true)
  }

  const handleNew = () => {
    setSelectedUser(null)
    setIsDialogOpen(true)
  }

  const handleToggleStatus = (u: User, val: boolean) => {
    updateUser(u.id, { isActive: val })
    toast({
      title: 'Status atualizado',
      description: `O usuário ${u.name} agora está ${val ? 'Ativo' : 'Inativo'}.`,
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center bg-muted/30 p-4 rounded-lg border">
        <div>
          <h3 className="text-lg font-medium flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-primary" /> Gestão de Colaboradores
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Controle quem tem acesso à plataforma e quais perfis de permissão estão aplicados a cada
            um.
          </p>
        </div>
        <Button onClick={handleNew} className="shadow-sm">
          <Plus className="w-4 h-4 mr-2" /> Novo Usuário
        </Button>
      </div>

      <div className="border rounded-md overflow-hidden bg-card">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>E-mail</TableHead>
              <TableHead>Nível / Função</TableHead>
              <TableHead>Perfil de Acesso</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {db.users.map((u) => (
              <TableRow key={u.id} className="hover:bg-muted/50 transition-colors">
                <TableCell className="font-medium">
                  <div className="flex items-center gap-3">
                    <img
                      src={u.avatar}
                      alt={u.name}
                      className={cn(
                        'w-8 h-8 rounded-full bg-muted border transition-opacity',
                        u.isActive === false ? 'opacity-50 grayscale' : '',
                      )}
                    />
                    <span className={cn(u.isActive === false ? 'text-muted-foreground' : '')}>
                      {u.name}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">{u.email}</TableCell>
                <TableCell>
                  <div className="flex flex-col gap-1 items-start">
                    <span className="text-sm font-medium">{u.profileLevel || 'Colaborador'}</span>
                    <span className="text-xs text-muted-foreground">{u.role}</span>
                  </div>
                </TableCell>
                <TableCell>
                  {u.role === 'Administrador' ? (
                    <Badge variant="default" className="shadow-sm">
                      Administrador (Total)
                    </Badge>
                  ) : u.accessProfileId ? (
                    <Badge
                      variant="outline"
                      className="bg-background shadow-sm border-primary/20 text-primary"
                    >
                      {db.accessProfiles.find((p) => p.id === u.accessProfileId)?.name ||
                        'Desconhecido'}
                    </Badge>
                  ) : (
                    <Badge variant="secondary">Sem perfil associado</Badge>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Switch
                      checked={u.isActive !== false}
                      onCheckedChange={(val) => handleToggleStatus(u, val)}
                    />
                    <Badge
                      variant={u.isActive !== false ? 'success' : 'secondary'}
                      className="w-20 justify-center"
                    >
                      {u.isActive !== false ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEdit(u)}
                    title="Editar usuário e acessos"
                    className="hover:bg-primary/10 hover:text-primary"
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {db.users.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  Nenhum usuário cadastrado.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <UserFormDialog
        open={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        user={selectedUser}
      />
    </div>
  )
}

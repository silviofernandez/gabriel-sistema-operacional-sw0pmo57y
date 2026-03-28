import { useState } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Plus, Edit2, Trash2, ShieldCheck } from 'lucide-react'
import useDataStore from '@/stores/useDataStore'
import { ProfileFormDialog } from './ProfileFormDialog'
import { AccessProfile } from '@/types'

export function ProfilesTab() {
  const { db, deleteAccessProfile } = useDataStore()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingProfile, setEditingProfile] = useState<AccessProfile | null>(null)

  const handleNew = () => {
    setEditingProfile(null)
    setIsDialogOpen(true)
  }

  const handleEdit = (p: AccessProfile) => {
    setEditingProfile(p)
    setIsDialogOpen(true)
  }

  const handleDelete = (id: string) => {
    if (confirm('Tem certeza que deseja excluir este perfil? Os usuários ficarão sem acesso.')) {
      deleteAccessProfile(id)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-muted/30 p-4 rounded-lg border">
        <div>
          <h3 className="text-lg font-medium flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-primary" /> Perfis de Acesso (RBAC)
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Crie perfis personalizados e defina permissões granulares por módulo do sistema.
          </p>
        </div>
        <Button onClick={handleNew} className="shadow-sm whitespace-nowrap">
          <Plus className="w-4 h-4 mr-2" /> Novo Perfil
        </Button>
      </div>

      <div className="border rounded-md overflow-hidden bg-card">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead>Nome do Perfil</TableHead>
              <TableHead>Número de Usuários</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {db.accessProfiles.map((p) => {
              const count = db.users.filter((u) => u.accessProfileId === p.id).length
              return (
                <TableRow key={p.id} className="hover:bg-muted/50 transition-colors">
                  <TableCell className="font-medium">{p.name}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {count} usuário{count !== 1 && 's'} vinculado{count !== 1 && 's'}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(p)}
                        title="Editar Perfil"
                        className="hover:text-primary hover:bg-primary/10"
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(p.id)}
                        title="Excluir Perfil"
                        className="hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )
            })}
            {db.accessProfiles.length === 0 && (
              <TableRow>
                <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                  Nenhum perfil customizado cadastrado.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <ProfileFormDialog
        open={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        profile={editingProfile}
      />
    </div>
  )
}

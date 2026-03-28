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
import { Checkbox } from '@/components/ui/checkbox'
import { AppModule, ModulePermissions, AccessProfile } from '@/types'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import useDataStore from '@/stores/useDataStore'

interface Props {
  open: boolean
  onClose: () => void
  profile: AccessProfile | null
}

const modulesList: { id: AppModule; label: string }[] = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'properties', label: 'Imóveis' },
  { id: 'tasks', label: 'Tarefas & O.S.' },
  { id: 'kanban', label: 'Kanban Operacional' },
  { id: 'financial', label: 'Financeiro' },
  { id: 'contacts', label: 'Clientes & Contatos' },
]

export function ProfileFormDialog({ open, onClose, profile }: Props) {
  const { addAccessProfile, updateAccessProfile } = useDataStore()
  const [name, setName] = useState('')
  const [perms, setPerms] = useState<Record<AppModule, ModulePermissions>>({} as any)

  useEffect(() => {
    if (profile) {
      setName(profile.name)
      setPerms(profile.permissions)
    } else {
      setName('')
      const defaultPerms = modulesList.reduce(
        (acc, mod) => {
          acc[mod.id] = { view: false, create: false, edit: false }
          return acc
        },
        {} as Record<AppModule, ModulePermissions>,
      )
      setPerms(defaultPerms)
    }
  }, [profile, open])

  const toggle = (mod: AppModule, action: keyof ModulePermissions) => {
    setPerms((prev) => {
      const nextVal = !prev[mod]?.[action]
      const updatedModule = { ...prev[mod], [action]: nextVal }

      // Implicit rules: If user can Edit or Create, they MUST be able to View
      if ((action === 'edit' || action === 'create') && nextVal) {
        updatedModule.view = true
      }

      // If user loses View permission, they lose Edit and Create permissions
      if (action === 'view' && !nextVal) {
        updatedModule.create = false
        updatedModule.edit = false
      }

      return {
        ...prev,
        [mod]: updatedModule,
      }
    })
  }

  const handleSave = () => {
    if (!name.trim()) return
    if (profile) {
      updateAccessProfile(profile.id, { name, permissions: perms })
    } else {
      addAccessProfile({
        id: `prof_${Date.now()}`,
        name,
        permissions: perms,
      })
    }
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
      <DialogContent className="sm:max-w-[700px] p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle>{profile ? 'Editar Perfil de Acesso' : 'Novo Perfil de Acesso'}</DialogTitle>
          <DialogDescription>
            Defina as permissões granulares de visualização, criação e edição para cada módulo.
          </DialogDescription>
        </DialogHeader>

        <div className="p-6 pt-2 space-y-6">
          <div className="space-y-2">
            <Label htmlFor="profile-name">Nome do Perfil</Label>
            <Input
              id="profile-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Assistente Administrativo"
              className="bg-card"
            />
          </div>

          <div className="space-y-3">
            <Label>Matriz de Permissões</Label>
            <div className="border rounded-md overflow-hidden bg-card">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead>Módulo do Sistema</TableHead>
                    <TableHead className="text-center w-24">Visualizar</TableHead>
                    <TableHead className="text-center w-24">Criar</TableHead>
                    <TableHead className="text-center w-24">Editar</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {modulesList.map((mod) => (
                    <TableRow key={mod.id} className="hover:bg-muted/30">
                      <TableCell className="font-medium text-sm">{mod.label}</TableCell>
                      <TableCell className="text-center">
                        <Checkbox
                          checked={perms[mod.id]?.view}
                          onCheckedChange={() => toggle(mod.id, 'view')}
                        />
                      </TableCell>
                      <TableCell className="text-center">
                        <Checkbox
                          checked={perms[mod.id]?.create}
                          onCheckedChange={() => toggle(mod.id, 'create')}
                          disabled={!perms[mod.id]?.view}
                        />
                      </TableCell>
                      <TableCell className="text-center">
                        <Checkbox
                          checked={perms[mod.id]?.edit}
                          onCheckedChange={() => toggle(mod.id, 'edit')}
                          disabled={!perms[mod.id]?.view}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Nota: Desmarcar a permissão de "Visualizar" removerá automaticamente o acesso de
              "Criar" e "Editar".
            </p>
          </div>
        </div>

        <DialogFooter className="p-4 border-t bg-muted/20 sm:justify-end">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={!name.trim()}>
            Salvar Perfil
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

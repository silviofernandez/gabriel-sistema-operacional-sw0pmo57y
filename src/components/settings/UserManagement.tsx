import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { UsersTab } from './UsersTab'
import { ProfilesTab } from './ProfilesTab'
import { StagePermissionsTab } from './StagePermissionsTab'

export function UserManagement() {
  return (
    <div className="space-y-6">
      <Tabs defaultValue="stage-permissions" className="w-full">
        <TabsList className="bg-muted/50 p-1 border">
          <TabsTrigger value="stage-permissions">Permissões por Etapa & Coberturas</TabsTrigger>
          <TabsTrigger value="users">Usuários</TabsTrigger>
          <TabsTrigger value="profiles">Perfis de Acesso</TabsTrigger>
        </TabsList>
        <TabsContent value="stage-permissions" className="mt-4">
          <StagePermissionsTab />
        </TabsContent>
        <TabsContent value="users" className="mt-4">
          <UsersTab />
        </TabsContent>
        <TabsContent value="profiles" className="mt-4">
          <ProfilesTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}

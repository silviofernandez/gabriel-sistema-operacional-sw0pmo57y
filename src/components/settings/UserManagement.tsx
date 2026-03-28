import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { UsersTab } from './UsersTab'
import { ProfilesTab } from './ProfilesTab'

export function UserManagement() {
  return (
    <div className="animate-in fade-in zoom-in-95 duration-300 bg-card border rounded-xl shadow-sm p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold">Equipe e acessos</h2>
        <p className="text-muted-foreground mt-1">
          Gerencie os membros da equipe, atribua papéis e defina perfis de acesso customizados.
        </p>
      </div>

      <Tabs defaultValue="users" className="space-y-6">
        <TabsList className="grid w-full max-w-[400px] grid-cols-2">
          <TabsTrigger value="users">Usuários</TabsTrigger>
          <TabsTrigger value="profiles">Perfis de Acesso</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="focus-visible:outline-none">
          <UsersTab />
        </TabsContent>

        <TabsContent value="profiles" className="focus-visible:outline-none">
          <ProfilesTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}

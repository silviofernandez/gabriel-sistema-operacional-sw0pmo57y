import useAuthStore from '@/stores/useAuthStore'
import useDataStore from '@/stores/useDataStore'
import { AppModule } from '@/types'

export function usePermissions() {
  const { user, role, profileLevel } = useAuthStore()
  const { db } = useDataStore()

  // Always get the freshest user data from the local DB
  const currentUser = db.users.find((u) => u.id === user.id)
  const profile = db.accessProfiles?.find((p) => p.id === currentUser?.accessProfileId)

  // Admins bypass all module checks
  const isAdmin = role === 'Administrador' || currentUser?.role === 'Administrador'

  // Gestores and Diretores might also have some special bypasses depending on the app logic,
  // but for module-level granular permissions, we enforce the RBAC matrix unless Admin.
  const can = (module: AppModule, action: 'view' | 'create' | 'edit') => {
    if (isAdmin) return true

    // If no custom profile is assigned, default to restrictive (false)
    if (!profile) return false

    return profile.permissions[module]?.[action] ?? false
  }

  return { can, isAdmin, currentUser, profileLevel }
}

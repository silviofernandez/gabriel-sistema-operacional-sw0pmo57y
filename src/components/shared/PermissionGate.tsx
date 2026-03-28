import React from 'react'
import { usePermissions } from '@/hooks/usePermissions'
import { AppModule } from '@/types'

interface PermissionGateProps {
  children: React.ReactNode
  module: AppModule
  action: 'view' | 'create' | 'edit'
  fallback?: React.ReactNode
}

/**
 * A wrapper component that conditionally renders its children based on the current user's
 * granular module permissions (RBAC).
 * If the user does not have the specified permission, it renders the fallback (or nothing).
 */
export function PermissionGate({ children, module, action, fallback = null }: PermissionGateProps) {
  const { can } = usePermissions()

  if (can(module, action)) {
    return <>{children}</>
  }

  return <>{fallback}</>
}

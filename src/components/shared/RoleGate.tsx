import React from 'react'
import useAuthStore, { UserProfileLevel } from '@/stores/useAuthStore'

interface RoleGateProps {
  children: React.ReactNode
  allowedLevels: UserProfileLevel[]
  fallback?: React.ReactNode
}

export function RoleGate({ children, allowedLevels, fallback = null }: RoleGateProps) {
  const { profileLevel } = useAuthStore()

  if (allowedLevels.includes(profileLevel)) {
    return <>{children}</>
  }

  return <>{fallback}</>
}

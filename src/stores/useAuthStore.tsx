import React, { createContext, useContext, useState, useEffect, useMemo } from 'react'

export type UserRole =
  | 'Administrador'
  | 'Gestor'
  | 'Colaborador'
  | 'Equipe de Vistoria'
  | 'Equipe Administrativa'
  | 'Equipe Financeira'
  | 'Equipe Comercial'

export type UserProfileLevel = 'Colaborador' | 'Gestor' | 'Diretor'

interface AuthState {
  isAuthenticated: boolean
  needsOnboarding: boolean
  userId: string
  login: (id?: string) => void
  signup: () => void
  completeOnboarding: () => void
  logout: () => void
  role: UserRole
  setRole: (role: UserRole) => void
  profileLevel: UserProfileLevel
  setProfileLevel: (level: UserProfileLevel) => void
  user: {
    id: string
    name: string
    email: string
    avatar: string
  }
}

const AuthContext = createContext<AuthState | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('auth_isAuthenticated') === 'true'
  })
  const [needsOnboarding, setNeedsOnboarding] = useState<boolean>(() => {
    return localStorage.getItem('auth_needsOnboarding') === 'true'
  })
  const [role, setRole] = useState<UserRole>(() => {
    return (localStorage.getItem('auth_role') as UserRole) || 'Administrador'
  })
  const [profileLevel, setProfileLevel] = useState<UserProfileLevel>(() => {
    return (localStorage.getItem('auth_profileLevel') as UserProfileLevel) || 'Diretor'
  })
  const [userId, setUserId] = useState<string>(() => {
    return localStorage.getItem('auth_userId') || 'u1'
  })

  useEffect(() => {
    localStorage.setItem('auth_isAuthenticated', isAuthenticated.toString())
    localStorage.setItem('auth_needsOnboarding', needsOnboarding.toString())
    localStorage.setItem('auth_role', role)
    localStorage.setItem('auth_profileLevel', profileLevel)
    localStorage.setItem('auth_userId', userId)
  }, [isAuthenticated, needsOnboarding, role, profileLevel, userId])

  const user = useMemo(
    () => ({
      id: userId,
      name: profileLevel === 'Colaborador' ? 'João Paulo' : 'Carlos Silva',
      email: profileLevel === 'Colaborador' ? 'joao@alugai.com.br' : 'carlos@alugai.com.br',
      avatar: `https://img.usecurling.com/ppl/thumbnail?gender=male&seed=${profileLevel === 'Colaborador' ? '3' : '4'}`,
    }),
    [profileLevel, userId],
  )

  const login = (id?: string) => {
    setIsAuthenticated(true)
    setNeedsOnboarding(false)
    if (id) setUserId(id)
  }

  const signup = () => {
    setIsAuthenticated(true)
    setNeedsOnboarding(true)
  }

  const completeOnboarding = () => setNeedsOnboarding(false)

  const logout = () => {
    setIsAuthenticated(false)
    setNeedsOnboarding(false)
    localStorage.removeItem('auth_isAuthenticated')
    localStorage.removeItem('auth_needsOnboarding')
    localStorage.removeItem('auth_role')
    localStorage.removeItem('auth_profileLevel')
    localStorage.removeItem('auth_userId')
  }

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        needsOnboarding,
        userId,
        login,
        signup,
        completeOnboarding,
        logout,
        role,
        setRole,
        profileLevel,
        setProfileLevel,
        user,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export default function useAuthStore() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuthStore must be used within AuthProvider')
  return context
}

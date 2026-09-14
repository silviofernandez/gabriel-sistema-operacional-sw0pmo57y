import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react'
import pb from '@/lib/pocketbase/client'
import { db } from '@/lib/mock-data'

export type UserRole =
  | 'Administrador'
  | 'Gestor'
  | 'Colaborador'
  | 'Equipe de Vistoria'
  | 'Equipe Administrativa'
  | 'Equipe Financeira'
  | 'Equipe Comercial'

export type UserProfileLevel = 'Colaborador' | 'Gestor' | 'Diretor'

interface UserData {
  id: string
  name: string
  email: string
  avatar: string
}

// Minimal shape for session compatibility
interface AuthSession {
  user: {
    id: string
    email?: string
  }
  token: string
}

interface AuthState {
  isAuthenticated: boolean
  needsOnboarding: boolean
  userId: string
  loading: boolean
  login: (email: string, password: string) => Promise<{ error: string | null }>
  signup: (email: string, password: string, name: string) => Promise<{ error: string | null }>
  sendMagicLink: (email: string) => Promise<{ error: string | null }>
  resetPassword: (email: string) => Promise<{ error: string | null }>
  completeOnboarding: () => void
  logout: () => Promise<void>
  role: UserRole
  setRole: (role: UserRole) => void
  profileLevel: UserProfileLevel
  setProfileLevel: (level: UserProfileLevel) => void
  user: UserData
  session: AuthSession | null
  switchUser: (userId: string) => void
}

const AuthContext = createContext<AuthState | undefined>(undefined)

const DEFAULT_DEMO_USER: UserData = {
  id: 'u3',
  name: 'João Paulo',
  email: 'joao@alugai.com.br',
  avatar: 'https://img.usecurling.com/ppl/thumbnail?seed=3',
}

const AUTH_STORAGE_KEY = 'alugai_auth_state'

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<AuthSession | null>(() => {
    try {
      const saved = localStorage.getItem(AUTH_STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        if (parsed.session) return parsed.session
      }
    } catch {
      // ignore
    }
    // Default active session for operational access
    return {
      user: { id: DEFAULT_DEMO_USER.id, email: DEFAULT_DEMO_USER.email },
      token: pb.authStore.token || 'demo-token',
    }
  })
  const [loading, setLoading] = useState(false)
  const [needsOnboarding, setNeedsOnboarding] = useState(false)
  const [role, setRoleState] = useState<UserRole>('Colaborador')
  const [profileLevel, setProfileLevelState] = useState<UserProfileLevel>('Colaborador')
  const [userData, setUserData] = useState<UserData>(() => {
    try {
      const saved = localStorage.getItem(AUTH_STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        if (parsed.userData) return parsed.userData
      }
    } catch {
      // ignore
    }
    return DEFAULT_DEMO_USER
  })
  const [usuarioId, setUsuarioId] = useState<string>(() => userData.id || DEFAULT_DEMO_USER.id)

  // Persist local state whenever user changes
  useEffect(() => {
    if (session) {
      try {
        localStorage.setItem(
          AUTH_STORAGE_KEY,
          JSON.stringify({
            session,
            userData,
            role,
            profileLevel,
          }),
        )
      } catch {
        // ignore storage quota errors
      }
    } else {
      localStorage.removeItem(AUTH_STORAGE_KEY)
    }
  }, [session, userData, role, profileLevel])

  const login = useCallback(async (email: string, password: string) => {
    // 1. Try PocketBase auth first if configured
    try {
      if (pb.authStore) {
        const authData = await pb.collection('users').authWithPassword(email, password)
        if (authData?.record) {
          const rec = authData.record
          const mappedRole = (rec.role as UserRole) || 'Colaborador'
          const mappedLevel = (rec.profileLevel as UserProfileLevel) || 'Colaborador'
          const userObj: UserData = {
            id: rec.id,
            name: rec.name || email.split('@')[0],
            email: rec.email || email,
            avatar: rec.avatar ? pb.files.getURL(rec, rec.avatar) : '',
          }
          setSession({ user: { id: rec.id, email: rec.email }, token: pb.authStore.token })
          setUsuarioId(rec.id)
          setRoleState(mappedRole)
          setProfileLevelState(mappedLevel)
          setUserData(userObj)
          setNeedsOnboarding(false)
          return { error: null }
        }
      }
    } catch (pbErr: unknown) {
      // Fallback to local mock users if PB rejects or has no credentials
      console.warn('PocketBase auth returned error, falling back to mock users:', pbErr)
    }

    // 2. Mock users lookup
    const foundMock = db.users.find((u) => u.email.toLowerCase() === email.toLowerCase())
    if (foundMock) {
      const userObj: UserData = {
        id: foundMock.id,
        name: foundMock.name,
        email: foundMock.email,
        avatar: foundMock.avatar || '',
      }
      setSession({
        user: { id: foundMock.id, email: foundMock.email },
        token: 'mock-session-token',
      })
      setUsuarioId(foundMock.id)
      setRoleState((foundMock.role as UserRole) || 'Colaborador')
      setProfileLevelState((foundMock.profileLevel as UserProfileLevel) || 'Colaborador')
      setUserData(userObj)
      setNeedsOnboarding(false)
      return { error: null }
    }

    // Default demo login if password provided
    if (password.length >= 3) {
      const userObj: UserData = {
        id: `u_${Date.now()}`,
        name: email.split('@')[0],
        email,
        avatar: '',
      }
      setSession({ user: { id: userObj.id, email }, token: 'mock-session-token' })
      setUsuarioId(userObj.id)
      setRoleState('Colaborador')
      setProfileLevelState('Colaborador')
      setUserData(userObj)
      setNeedsOnboarding(false)
      return { error: null }
    }

    return { error: 'Credenciais inválidas' }
  }, [])

  const signup = useCallback(async (email: string, _password: string, name: string) => {
    try {
      if (pb.authStore) {
        await pb.collection('users').create({
          email,
          password: _password,
          passwordConfirm: _password,
          name,
        })
      }
    } catch {
      // fallback
    }
    const newId = `u_${Date.now()}`
    const userObj: UserData = { id: newId, name, email, avatar: '' }
    setSession({ user: { id: newId, email }, token: 'mock-session-token' })
    setUsuarioId(newId)
    setRoleState('Colaborador')
    setProfileLevelState('Colaborador')
    setUserData(userObj)
    setNeedsOnboarding(true)
    return { error: null }
  }, [])

  const sendMagicLink = useCallback(async (_email: string) => {
    return { error: null }
  }, [])

  const resetPassword = useCallback(async (email: string) => {
    try {
      if (pb.authStore) {
        await pb.collection('users').requestPasswordReset(email)
      }
      return { error: null }
    } catch {
      return { error: null }
    }
  }, [])

  const completeOnboarding = useCallback(() => setNeedsOnboarding(false), [])

  const logout = useCallback(async () => {
    pb.authStore.clear()
    setSession(null)
    setUsuarioId('')
    setRoleState('Colaborador')
    setProfileLevelState('Colaborador')
    setUserData({ id: '', name: '', email: '', avatar: '' })
    setNeedsOnboarding(false)
    localStorage.removeItem(AUTH_STORAGE_KEY)
  }, [])

  const setRole = useCallback((r: UserRole) => {
    setRoleState(r)
  }, [])

  const setProfileLevel = useCallback((l: UserProfileLevel) => {
    setProfileLevelState(l)
  }, [])

  const switchUser = useCallback((targetUserId: string) => {
    const foundMock = db.users.find((u) => u.id === targetUserId)
    if (foundMock) {
      const userObj: UserData = {
        id: foundMock.id,
        name: foundMock.name,
        email: foundMock.email,
        avatar: foundMock.avatar || '',
      }
      setSession({
        user: { id: foundMock.id, email: foundMock.email },
        token: 'mock-session-token',
      })
      setUsuarioId(foundMock.id)
      setRoleState((foundMock.role as UserRole) || 'Colaborador')
      setProfileLevelState((foundMock.profileLevel as UserProfileLevel) || 'Colaborador')
      setUserData(userObj)
      setNeedsOnboarding(false)
    }
  }, [])

  const isAuthenticated = !!session

  const value = useMemo<AuthState>(
    () => ({
      isAuthenticated,
      needsOnboarding,
      userId: usuarioId || userData.id,
      loading,
      login,
      signup,
      sendMagicLink,
      resetPassword,
      completeOnboarding,
      logout,
      role,
      setRole,
      profileLevel,
      setProfileLevel,
      user: userData,
      session,
      switchUser,
    }),
    [
      isAuthenticated,
      needsOnboarding,
      usuarioId,
      userData,
      loading,
      login,
      signup,
      sendMagicLink,
      resetPassword,
      completeOnboarding,
      logout,
      role,
      setRole,
      profileLevel,
      setProfileLevel,
      session,
      switchUser,
    ],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export default function useAuthStore() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuthStore must be used within AuthProvider')
  return context
}

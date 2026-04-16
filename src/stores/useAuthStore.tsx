import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { User, Session } from '@supabase/supabase-js'

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
  session: Session | null
}

const AuthContext = createContext<AuthState | undefined>(undefined)

async function fetchUserProfile(authUserId: string) {
  const { data, error } = await supabase
    .from('usuarios')
    .select('*')
    .eq('auth_user_id', authUserId)
    .single()
  if (error) { console.error('Erro ao buscar perfil:', error.message); return null }
  return data
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [needsOnboarding, setNeedsOnboarding] = useState(false)
  const [role, setRoleState] = useState<UserRole>('Colaborador')
  const [profileLevel, setProfileLevelState] = useState<UserProfileLevel>('Colaborador')
  const [userData, setUserData] = useState<UserData>({ id: '', name: '', email: '', avatar: '' })
  const [usuarioId, setUsuarioId] = useState('')

  const loadProfile = useCallback(async (authUser: User) => {
    const profile = await fetchUserProfile(authUser.id)
    if (profile) {
      setUsuarioId(profile.id)
      setRoleState((profile.role as UserRole) || 'Colaborador')
      setProfileLevelState((profile.profile_level as UserProfileLevel) || 'Colaborador')
      setUserData({
        id: profile.id,
        name: profile.name || authUser.email?.split('@')[0] || '',
        email: profile.email || authUser.email || '',
        avatar: profile.avatar || '',
      })
      setNeedsOnboarding(false)
    } else {
      setUserData({ id: authUser.id, name: authUser.email?.split('@')[0] || '', email: authUser.email || '', avatar: '' })
      setNeedsOnboarding(true)
    }
  }, [])

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s)
      if (s?.user) { loadProfile(s.user).finally(() => setLoading(false)) }
      else { setLoading(false) }
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, s) => {
      setSession(s)
      if (s?.user) { await loadProfile(s.user) }
      else { setUsuarioId(''); setRoleState('Colaborador'); setProfileLevelState('Colaborador'); setUserData({ id: '', name: '', email: '', avatar: '' }); setNeedsOnboarding(false) }
    })
    return () => { subscription.unsubscribe() }
  }, [loadProfile])

  const login = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error: error ? error.message : null }
  }, [])

  const signup = useCallback(async (email: string, password: string, name: string) => {
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) return { error: error.message }
    if (data.user) {
      await supabase.from('usuarios').insert({ auth_user_id: data.user.id, name, email, role: 'Colaborador', profile_level: 'Colaborador', is_active: true })
    }
    return { error: null }
  }, [])

  const sendMagicLink = useCallback(async (email: string) => {
    const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: window.location.origin + '/auth/callback' } })
    return { error: error ? error.message : null }
  }, [])

  const resetPassword = useCallback(async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin + '/auth/reset-password' })
    return { error: error ? error.message : null }
  }, [])

  const completeOnboarding = useCallback(() => setNeedsOnboarding(false), [])

  const logout = useCallback(async () => {
    await supabase.auth.signOut()
    setSession(null); setUsuarioId(''); setRoleState('Colaborador'); setProfileLevelState('Colaborador')
    setUserData({ id: '', name: '', email: '', avatar: '' }); setNeedsOnboarding(false)
  }, [])

  const setRole = useCallback((r: UserRole) => {
    setRoleState(r)
    if (usuarioId) { supabase.from('usuarios').update({ role: r }).eq('id', usuarioId).then() }
  }, [usuarioId])

  const setProfileLevel = useCallback((l: UserProfileLevel) => {
    setProfileLevelState(l)
    if (usuarioId) { supabase.from('usuarios').update({ profile_level: l }).eq('id', usuarioId).then() }
  }, [usuarioId])

  const isAuthenticated = !!session

  const value = useMemo<AuthState>(() => ({
    isAuthenticated, needsOnboarding, userId: usuarioId || userData.id, loading,
    login, signup, sendMagicLink, resetPassword, completeOnboarding, logout,
    role, setRole, profileLevel, setProfileLevel, user: userData, session,
  }), [isAuthenticated, needsOnboarding, usuarioId, userData, loading, login, signup, sendMagicLink, resetPassword, completeOnboarding, logout, role, setRole, profileLevel, setProfileLevel, session])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export default function useAuthStore() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuthStore must be used within AuthProvider')
  return context
  }

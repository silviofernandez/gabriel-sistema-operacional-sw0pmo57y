import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { empresaService, EmpresaConfig } from '@/services/empresaService'

interface EmpresaContextType {
  config: EmpresaConfig | null
  loading: boolean
  logoUrl: string | null
  refreshConfig: () => Promise<void>
  salvarConfig: (dados: Partial<EmpresaConfig>) => Promise<boolean>
  fazerUploadLogo: (file: File) => Promise<boolean>
  removerLogo: () => Promise<boolean>
}

const EmpresaContext = createContext<EmpresaContextType | undefined>(undefined)

export const EmpresaProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [config, setConfig] = useState<EmpresaConfig | null>(null)
  const [loading, setLoading] = useState(true)

  const refreshConfig = useCallback(async () => {
    try {
      const data = await empresaService.getConfig()
      setConfig(data)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refreshConfig()
  }, [refreshConfig])

  const salvarConfig = useCallback(
    async (dados: Partial<EmpresaConfig>) => {
      if (!config?.id) return false
      const updated = await empresaService.updateConfig(config.id, dados)
      if (updated) {
        setConfig(updated)
        return true
      }
      return false
    },
    [config?.id],
  )

  const fazerUploadLogo = useCallback(
    async (file: File) => {
      if (!config?.id) return false
      const url = await empresaService.uploadLogo(config.id, file)
      if (url) {
        await refreshConfig()
        return true
      }
      return false
    },
    [config?.id, refreshConfig],
  )

  const removerLogo = useCallback(async () => {
    if (!config?.id) return false
    const ok = await empresaService.removerLogo(config.id)
    if (ok) {
      await refreshConfig()
      return true
    }
    return false
  }, [config?.id, refreshConfig])

  return (
    <EmpresaContext.Provider
      value={{
        config,
        loading,
        logoUrl: config?.logo_url || null,
        refreshConfig,
        salvarConfig,
        fazerUploadLogo,
        removerLogo,
      }}
    >
      {children}
    </EmpresaContext.Provider>
  )
}

export function useEmpresa() {
  const context = useContext(EmpresaContext)
  if (!context) {
    throw new Error('useEmpresa must be used within an EmpresaProvider')
  }
  return context
}

export default useEmpresa

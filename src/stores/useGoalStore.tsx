import React, { createContext, useContext, useState } from 'react'

interface GoalState {
  meta1: number
  meta2: number
  supermeta: number
  setMeta1: (val: number) => void
  setMeta2: (val: number) => void
  setSupermeta: (val: number) => void
}

const GoalContext = createContext<GoalState | undefined>(undefined)

export const GoalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [meta1, setMeta1] = useState<number>(10000)
  const [meta2, setMeta2] = useState<number>(15000)
  const [supermeta, setSupermeta] = useState<number>(20000)

  return (
    <GoalContext.Provider
      value={{
        meta1,
        meta2,
        supermeta,
        setMeta1,
        setMeta2,
        setSupermeta,
      }}
    >
      {children}
    </GoalContext.Provider>
  )
}

export default function useGoalStore() {
  const context = useContext(GoalContext)
  if (!context) {
    throw new Error('useGoalStore must be used within a GoalProvider')
  }
  return context
}

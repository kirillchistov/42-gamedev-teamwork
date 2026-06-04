import { createContext, useContext, type ReactNode } from 'react'

const PresentationNavContext = createContext<(() => void) | null>(null)

export function PresentationNavProvider({
  onLeavePresentation,
  children,
}: {
  onLeavePresentation?: () => void
  children: ReactNode
}) {
  return (
    <PresentationNavContext.Provider value={onLeavePresentation ?? null}>
      {children}
    </PresentationNavContext.Provider>
  )
}

export function usePresentationLeave(): (() => void) | null {
  return useContext(PresentationNavContext)
}

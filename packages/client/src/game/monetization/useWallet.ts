import { useCallback, useEffect, useState } from 'react'

import {
  ECONOMY_CHANGED_EVENT,
  getDayStats,
  readWallet,
  type EconomyDayStats,
  type WalletState,
} from './economy'

export function useWallet() {
  const [wallet, setWallet] = useState<WalletState>(() => readWallet())
  const [dayStats, setDayStats] = useState<EconomyDayStats>(() => getDayStats())

  const refresh = useCallback(() => {
    setWallet(readWallet())
    setDayStats(getDayStats())
  }, [])

  useEffect(() => {
    refresh()
    const onChange = () => refresh()
    window.addEventListener(ECONOMY_CHANGED_EVENT, onChange)
    return () => window.removeEventListener(ECONOMY_CHANGED_EVENT, onChange)
  }, [refresh])

  return { wallet, dayStats, refresh }
}

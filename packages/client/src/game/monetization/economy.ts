/**
 * Локальная демо-экономика (Phase A): credits + crystals в localStorage.
 * Позже можно синхронизировать с API / профилем пользователя.
 */

export type Currency = 'credits' | 'crystals'

export type WalletState = {
  credits: number
  crystals: number
}

export type ContinuePaymentMethod = 'credits' | 'crystals' | 'rewarded'

export type HintPaymentMethod = 'free' | 'credits' | 'crystals'

export type EconomyDayStats = {
  dayKey: string
  creditsContinuesUsed: number
  rewardedContinuesUsed: number
  freeHintsUsed: number
}

export type FeatureRequestCategory = 'field' | 'tiles' | 'branding' | 'other'

export type FeatureRequestEntry = {
  id: string
  category: FeatureRequestCategory
  title: string
  details: string
  budgetCrystals?: number
  createdAt: string
}

const WALLET_KEY = 'match3:economy:wallet'
const DAY_STATS_KEY = 'match3:economy:day-stats'
const CUSTOM_BG_UNLOCK_KEY = 'match3:economy:custom-bg-unlocked'
const FEATURE_REQUESTS_KEY = 'match3:economy:feature-requests'
const SESSION_HINTS_KEY = 'match3:economy:session-hints'

export const ECONOMY_CHANGED_EVENT = 'match3:economy-changed'

export const DEFAULT_WALLET: WalletState = {
  credits: 2400,
  crystals: 120,
}

export const PRICES = {
  continue: {
    creditsBase: 900,
    creditsDailyCap: 3,
    crystalsBase: 60,
    crystalsPremiumPack: 60,
    rewardedMoves: 3,
    rewardedDailyCap: 2,
    movesGrant: 5,
    secondsGrant: 20,
    premiumExtraBooster: true,
  },
  hint: {
    freePerDay: 3,
    freePerSession: 2,
    credits: 180,
    crystals: 12,
    hintPackCredits: 520,
    hintPackAmount: 5,
  },
  customBg: {
    credits: 450,
    crystals: 120,
  },
  hintPackShop: {
    credits: 520,
    crystals: 35,
    amount: 5,
  },
} as const

function todayKey(): string {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function notifyEconomyChanged(): void {
  if (typeof window === 'undefined') return
  try {
    window.dispatchEvent(new Event(ECONOMY_CHANGED_EVENT))
  } catch {
    // noop
  }
}

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback
  try {
    const raw = window.localStorage.getItem(key)
    if (!raw) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

function writeJson(key: string, value: unknown): void {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(key, JSON.stringify(value))
}

export function readWallet(): WalletState {
  const w = readJson<Partial<WalletState>>(WALLET_KEY, DEFAULT_WALLET)
  return {
    credits: Math.max(0, Math.floor(w.credits ?? DEFAULT_WALLET.credits)),
    crystals: Math.max(0, Math.floor(w.crystals ?? DEFAULT_WALLET.crystals)),
  }
}

export function writeWallet(next: WalletState): WalletState {
  const wallet = {
    credits: Math.max(0, Math.floor(next.credits)),
    crystals: Math.max(0, Math.floor(next.crystals)),
  }
  writeJson(WALLET_KEY, wallet)
  notifyEconomyChanged()
  return wallet
}

export function grantWalletBonus(patch: Partial<WalletState>): WalletState {
  const cur = readWallet()
  return writeWallet({
    credits: cur.credits + (patch.credits ?? 0),
    crystals: cur.crystals + (patch.crystals ?? 0),
  })
}

export function spendCurrency(
  currency: Currency,
  amount: number
): { ok: true; wallet: WalletState } | { ok: false; reason: string } {
  const cost = Math.max(0, Math.floor(amount))
  if (cost === 0) {
    return { ok: true, wallet: readWallet() }
  }
  const wallet = readWallet()
  const balance = currency === 'credits' ? wallet.credits : wallet.crystals
  if (balance < cost) {
    return {
      ok: false,
      reason:
        currency === 'credits'
          ? 'Недостаточно кредитов'
          : 'Недостаточно кристаллов',
    }
  }
  const next =
    currency === 'credits'
      ? { ...wallet, credits: wallet.credits - cost }
      : { ...wallet, crystals: wallet.crystals - cost }
  return { ok: true, wallet: writeWallet(next) }
}

function readDayStats(): EconomyDayStats {
  const key = todayKey()
  const stored = readJson<EconomyDayStats | null>(DAY_STATS_KEY, null)
  if (!stored || stored.dayKey !== key) {
    return {
      dayKey: key,
      creditsContinuesUsed: 0,
      rewardedContinuesUsed: 0,
      freeHintsUsed: 0,
    }
  }
  return stored
}

function writeDayStats(stats: EconomyDayStats): EconomyDayStats {
  writeJson(DAY_STATS_KEY, stats)
  notifyEconomyChanged()
  return stats
}

export function getDayStats(): EconomyDayStats {
  return readDayStats()
}

/** Сколько стоит continue на N-й раз в одной попытке (1-based). */
export function continueCreditsPrice(continueIndex: number): number {
  const n = Math.max(1, continueIndex)
  return Math.floor(PRICES.continue.creditsBase * (1 + (n - 1) * 0.35))
}

export function continueCrystalsPrice(continueIndex: number): number {
  const n = Math.max(1, continueIndex)
  return n === 1
    ? PRICES.continue.crystalsBase
    : Math.floor(PRICES.continue.crystalsBase * (1 + (n - 1) * 0.25))
}

export function canPayContinueWithCredits(): boolean {
  const stats = readDayStats()
  return stats.creditsContinuesUsed < PRICES.continue.creditsDailyCap
}

export function canPayContinueWithRewarded(): boolean {
  const stats = readDayStats()
  return stats.rewardedContinuesUsed < PRICES.continue.rewardedDailyCap
}

export type ContinuePurchaseResult =
  | {
      ok: true
      method: ContinuePaymentMethod
      extraMoves: number
      extraSeconds: number
      includeBooster: boolean
      wallet?: WalletState
    }
  | { ok: false; reason: string }

export function purchaseContinue(
  method: ContinuePaymentMethod,
  continueIndex: number,
  limitMode: 'moves' | 'time'
): ContinuePurchaseResult {
  const stats = readDayStats()
  const extraMoves =
    limitMode === 'moves'
      ? method === 'rewarded'
        ? PRICES.continue.rewardedMoves
        : PRICES.continue.movesGrant
      : 0
  const extraSeconds = limitMode === 'time' ? PRICES.continue.secondsGrant : 0
  const includeBooster = method === 'crystals'

  if (method === 'credits') {
    if (!canPayContinueWithCredits()) {
      return {
        ok: false,
        reason: `Лимит продолжений за кредиты сегодня (${PRICES.continue.creditsDailyCap})`,
      }
    }
    const price = continueCreditsPrice(continueIndex)
    const spent = spendCurrency('credits', price)
    if (!spent.ok) return spent
    writeDayStats({
      ...stats,
      creditsContinuesUsed: stats.creditsContinuesUsed + 1,
    })
    return {
      ok: true,
      method,
      extraMoves,
      extraSeconds,
      includeBooster,
      wallet: spent.wallet,
    }
  }

  if (method === 'crystals') {
    const price = continueCrystalsPrice(continueIndex)
    const spent = spendCurrency('crystals', price)
    if (!spent.ok) return spent
    return {
      ok: true,
      method,
      extraMoves,
      extraSeconds,
      includeBooster,
      wallet: spent.wallet,
    }
  }

  if (!canPayContinueWithRewarded()) {
    return {
      ok: false,
      reason: `Лимит видео-продолжений сегодня (${PRICES.continue.rewardedDailyCap})`,
    }
  }
  writeDayStats({
    ...stats,
    rewardedContinuesUsed: stats.rewardedContinuesUsed + 1,
  })
  return {
    ok: true,
    method,
    extraMoves,
    extraSeconds,
    includeBooster: false,
  }
}

export function readSessionFreeHintsUsed(): number {
  if (typeof window === 'undefined') return 0
  try {
    const raw = window.sessionStorage.getItem(SESSION_HINTS_KEY)
    const n = Number(raw)
    return Number.isFinite(n) ? Math.max(0, Math.floor(n)) : 0
  } catch {
    return 0
  }
}

export function incrementSessionFreeHints(): number {
  const next = readSessionFreeHintsUsed() + 1
  if (typeof window !== 'undefined') {
    window.sessionStorage.setItem(SESSION_HINTS_KEY, String(next))
  }
  notifyEconomyChanged()
  return next
}

export function resetSessionFreeHints(): void {
  if (typeof window !== 'undefined') {
    window.sessionStorage.removeItem(SESSION_HINTS_KEY)
  }
}

export function canUseFreeHint(): boolean {
  const stats = readDayStats()
  if (stats.freeHintsUsed >= PRICES.hint.freePerDay) return false
  if (readSessionFreeHintsUsed() >= PRICES.hint.freePerSession) {
    return false
  }
  return true
}

export function consumeFreeHint(): void {
  const stats = readDayStats()
  writeDayStats({
    ...stats,
    freeHintsUsed: stats.freeHintsUsed + 1,
  })
  incrementSessionFreeHints()
}

export type HintPurchaseResult =
  | { ok: true; method: HintPaymentMethod; wallet?: WalletState }
  | { ok: false; reason: string }

export function purchaseHint(): HintPurchaseResult {
  if (canUseFreeHint()) {
    consumeFreeHint()
    return { ok: true, method: 'free' }
  }
  const wallet = readWallet()
  if (wallet.credits >= PRICES.hint.credits) {
    const spent = spendCurrency('credits', PRICES.hint.credits)
    if (spent.ok) {
      return { ok: true, method: 'credits', wallet: spent.wallet }
    }
    return spent
  }
  const spent = spendCurrency('crystals', PRICES.hint.crystals)
  if (spent.ok) {
    return { ok: true, method: 'crystals', wallet: spent.wallet }
  }
  return {
    ok: false,
    reason: 'Недостаточно кредитов и кристаллов для подсказки',
  }
}

export function isCustomBgUnlocked(): boolean {
  if (typeof window === 'undefined') return false
  return window.localStorage.getItem(CUSTOM_BG_UNLOCK_KEY) === '1'
}

export function unlockCustomBg(
  currency: Currency
): { ok: true; wallet: WalletState } | { ok: false; reason: string } {
  if (isCustomBgUnlocked()) {
    return { ok: true, wallet: readWallet() }
  }
  const price =
    currency === 'credits' ? PRICES.customBg.credits : PRICES.customBg.crystals
  const spent = spendCurrency(currency, price)
  if (!spent.ok) return spent
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(CUSTOM_BG_UNLOCK_KEY, '1')
  }
  notifyEconomyChanged()
  return { ok: true, wallet: spent.wallet }
}

export function readFeatureRequests(): FeatureRequestEntry[] {
  return readJson<FeatureRequestEntry[]>(FEATURE_REQUESTS_KEY, [])
}

export function submitFeatureRequest(input: {
  category: FeatureRequestCategory
  title: string
  details: string
  budgetCrystals?: number
}): FeatureRequestEntry {
  const title = input.title.trim()
  const details = input.details.trim()
  if (!title || !details) {
    throw new Error('Заполните название и описание')
  }
  const entry: FeatureRequestEntry = {
    id: `fr-${Date.now()}`,
    category: input.category,
    title,
    details,
    budgetCrystals: input.budgetCrystals,
    createdAt: new Date().toISOString(),
  }
  const list = readFeatureRequests()
  list.unshift(entry)
  writeJson(FEATURE_REQUESTS_KEY, list.slice(0, 40))
  notifyEconomyChanged()
  return entry
}

export function purchaseHintPack(
  currency: Currency
): { ok: true; wallet: WalletState } | { ok: false; reason: string } {
  const price =
    currency === 'credits'
      ? PRICES.hintPackShop.credits
      : PRICES.hintPackShop.crystals
  const spent = spendCurrency(currency, price)
  if (!spent.ok) return spent
  const stats = readDayStats()
  writeDayStats({
    ...stats,
    freeHintsUsed: Math.max(
      0,
      stats.freeHintsUsed - PRICES.hintPackShop.amount
    ),
  })
  return { ok: true, wallet: spent.wallet }
}

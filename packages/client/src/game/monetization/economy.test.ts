import {
  canUseFreeHint,
  consumeFreeHint,
  continueCreditsPrice,
  purchaseContinue,
  readWallet,
  spendCurrency,
  writeWallet,
} from './economy'

describe('economy', () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
    writeWallet({ credits: 5000, crystals: 200 })
  })

  test('continue price grows with index', () => {
    expect(continueCreditsPrice(1)).toBeLessThan(continueCreditsPrice(3))
  })

  test('purchaseContinue spends credits', () => {
    const before = readWallet().credits
    const res = purchaseContinue('credits', 1, 'moves')
    expect(res.ok).toBe(true)
    if (res.ok) {
      expect(res.extraMoves).toBe(5)
      expect(readWallet().credits).toBeLessThan(before)
    }
  })

  test('free hints respect session cap', () => {
    expect(canUseFreeHint()).toBe(true)
    for (let i = 0; i < 2; i += 1) {
      expect(canUseFreeHint()).toBe(true)
      consumeFreeHint()
    }
    expect(canUseFreeHint()).toBe(false)
  })

  test('spendCurrency rejects insufficient balance', () => {
    writeWallet({ credits: 10, crystals: 0 })
    const res = spendCurrency('credits', 500)
    expect(res.ok).toBe(false)
  })
})

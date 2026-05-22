import {
  compareLeaderboardRecordDates,
  formatLeaderboardRecordDateForDisplay,
  normalizeLeaderboardRecordDate,
} from './leaderboardDate'

describe('leaderboardDate', () => {
  it('keeps ISO YYYY-MM-DD', () => {
    expect(
      normalizeLeaderboardRecordDate('2026-05-06')
    ).toBe('2026-05-06')
  })

  it('converts DD.MM.YYYY to ISO', () => {
    expect(
      normalizeLeaderboardRecordDate('30.04.2026')
    ).toBe('2026-04-30')
  })

  it('compareLeaderboardRecordDates orders ISO chronologically', () => {
    expect(
      compareLeaderboardRecordDates(
        '2026-04-30',
        '2026-05-06'
      )
    ).toBeLessThan(0)
  })

  it('formats normalized date for ru-RU display', () => {
    expect(
      formatLeaderboardRecordDateForDisplay(
        '2026-05-06'
      )
    ).toBe('06.05.2026')
  })
})

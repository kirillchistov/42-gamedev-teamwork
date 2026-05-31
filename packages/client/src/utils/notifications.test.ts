import {
  readNotificationsOptIn,
  writeNotificationsOptIn,
  NOTIFICATIONS_OPT_IN_KEY,
} from './notifications'

describe('notifications storage', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it('reads and writes opt-in flag', () => {
    expect(readNotificationsOptIn()).toBe(false)
    writeNotificationsOptIn(true)
    expect(window.localStorage.getItem(NOTIFICATIONS_OPT_IN_KEY)).toBe('1')
    expect(readNotificationsOptIn()).toBe(true)
    writeNotificationsOptIn(false)
    expect(readNotificationsOptIn()).toBe(false)
  })
})

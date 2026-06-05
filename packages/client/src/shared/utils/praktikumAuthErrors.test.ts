import {
  humanizeApiReason,
  humanizePraktikumAuthReason,
  parseJsonReasonFromText,
} from './praktikumAuthErrors'

describe('praktikumAuthErrors', () => {
  it('parseJsonReasonFromText extracts reason', () => {
    expect(parseJsonReasonFromText('{"reason":"Forbidden"}')).toBe('Forbidden')
  })

  it('humanizes incorrect login from Praktikum API', () => {
    expect(humanizePraktikumAuthReason('Login or password is incorrect')).toBe(
      'Неверный логин или пароль'
    )
  })

  it('humanizes Unauthorized as wrong credentials on signin', () => {
    expect(humanizePraktikumAuthReason('Unauthorized')).toBe(
      'Неверный логин или пароль'
    )
  })

  it('keeps existing Russian messages', () => {
    expect(humanizePraktikumAuthReason('Неверный логин или пароль')).toBe(
      'Неверный логин или пароль'
    )
  })

  it('humanizes forum Forbidden', () => {
    expect(humanizeApiReason('Forbidden')).toBe(
      'Доступ запрещён. Войдите в аккаунт.'
    )
  })

  it('humanizes unknown English API reason to fallback', () => {
    expect(humanizeApiReason('Something unexpected happened')).toBe(
      'Не удалось выполнить запрос. Попробуйте позже.'
    )
  })
})

import React, { useEffect, useState } from 'react'
import { Helmet } from 'react-helmet'
import { Header } from '../components/Header'
import { Footer } from '../components/Footer'
import { usePage } from '../hooks/usePage'
import { PageInitArgs } from '../routes'
import { Button, Input, FieldError } from '../shared/ui'
import { userApi, ProfileData } from '../shared/api/userApi'
import { API_RESOURCES_URL } from '../constants'
// import { DEFAULT_AVATAR_PATH } from '../constants'
// при необходимости позже можно подтянуть selectUser / fetchUserThunk
import { useValidate } from '../hooks/useValidate'

export const ProfilePage: React.FC = () => {
  const [profile, setProfile] = useState<ProfileData>({
    first_name: '',
    second_name: '',
    display_name: '',
    email: '',
    phone: '',
    login: '',
  })
  const [passwords, setPasswords] = useState<{ [key: string]: string }>({
    oldPassword: '',
    newPassword: '',
  })

  const [avatar, setAvatar] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const profileValidate = useValidate(profile)
  const passwordsValidate = useValidate(passwords)

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const data = await userApi.getProfile()
        setProfile({
          first_name: data.first_name || '',
          second_name: data.second_name || '',
          display_name: data.display_name || '',
          email: data.email || '',
          phone: data.phone || '',
          login: data.login || '',
        })
        setAvatar(data.avatar)
      } catch {
        console.log('Не удалось загрузить профиль')
      }
    }
    void loadProfile()
    profileValidate.doValidate(profile)
    passwordsValidate.doValidate(passwords)
  }, [])

  const handleChange: React.ChangeEventHandler<HTMLInputElement> = e => {
    const { name, value } = e.target
    setProfile(prev => ({ ...prev, [name]: value }))
  }

  const handleBlur = () => {
    profileValidate.doValidate(profile)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    profileValidate.doValidate(profile)

    try {
      await userApi.updateProfile(profile)
      console.log('Профиль обновлён')
    } catch {
      console.log('Ошибка обновления профиля')
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const { oldPassword, newPassword } = passwords
      await userApi.changePassword({ oldPassword, newPassword })
      console.log('Пароль изменён')
      setPasswords({
        oldPassword: '',
        newPassword: '',
      })
    } catch {
      console.log('Ошибка смены пароля')
    }
  }

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      const updated = await userApi.updateAvatar(file)
      console.log('Ответ сервера:', updated)
      const avatarUrl = updated.avatar
        ? `${API_RESOURCES_URL}${updated.avatar}`
        : null
      setAvatar(avatarUrl)
      alert('Аватар обновлён')
    } catch {
      alert('Ошибка загрузки аватара')
    }
  }

  const handleAvatarDelete = async () => {
    try {
      await userApi.deleteAvatar()
      setAvatar(null)
      alert('Аватар удалён')
    } catch {
      alert('Ошибка удаления аватара')
    }
  }

  usePage({ initPage: initProfilePage })

  return (
    <div className="landing landing--light-flat AuthPage">
      <Helmet>
        <meta charSet="utf-8" />
        <title>Профиль игрока</title>
        <meta
          name="description"
          content="Демо‑страница профиля игрока Cosmic Match."
        />
      </Helmet>

      <Header />

      <main className="auth-main">
        <section className="auth-card auth-card--wide">
          <h1>Профиль игрока</h1>

          {/* Аватар */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              margin: '12px 0 24px',
              flexWrap: 'wrap',
            }}>
            <div
              style={{
                width: 96,
                height: 96,
                borderRadius: '999px',
                overflow: 'hidden',
                background:
                  'radial-gradient(circle at 30% 30%, #6366f1, #0f172a)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow:
                  '0 10px 25px rgba(15,23,42,0.9), 0 0 0 2px rgba(148,163,184,0.7)',
              }}>
              {avatar ? (
                <img
                  src={avatar}
                  alt="avatar"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <div
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: '999px',
                    background:
                      'radial-gradient(circle at 30% 30%, #38bdf8, #4c1d95)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontSize: 32,
                  }}>
                  👤
                </div>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <Button type="button" variant="flat" onClick={handleAvatarDelete}>
                Удалить аватар
              </Button>

              <input
                type="file"
                id="avatar-upload"
                accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                style={{ display: 'none' }}
                onChange={handleAvatarChange}
              />

              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  document.getElementById('avatar-upload')?.click()
                }>
                Сменить аватар
              </Button>
            </div>
          </div>

          {/* Форма профиля */}
          <form
            className="auth-form auth-form--grid"
            onSubmit={handleSubmit}
            id="profile-form"
            noValidate>
            <label>
              Имя
              <Input
                type="text"
                name="first_name"
                placeholder="Имя"
                value={profile.first_name}
                onChange={handleChange}
                onBlur={handleBlur}
              />
              <FieldError message={profileValidate.errors.first_name} />
            </label>

            <label>
              Фамилия
              <Input
                type="text"
                name="second_name"
                placeholder="Фамилия"
                value={profile.second_name}
                onChange={handleChange}
                onBlur={handleBlur}
              />
              <FieldError message={profileValidate.errors.second_name} />
            </label>

            <label>
              Почта
              <Input
                type="email"
                name="email"
                placeholder="user@example.com"
                value={profile.email}
                onChange={handleChange}
                onBlur={handleBlur}
              />
              <FieldError message={profileValidate.errors.email} />
            </label>

            <label>
              Телефон
              <Input
                type="tel"
                name="phone"
                placeholder="+7..."
                value={profile.phone}
                onChange={handleChange}
                onBlur={handleBlur}
              />
              <FieldError message={profileValidate.errors.phone} />
            </label>

            <label>
              Логин
              <Input
                type="text"
                name="login"
                placeholder="login"
                value={profile.login}
                onChange={handleChange}
                onBlur={handleBlur}
              />
              <FieldError message={profileValidate.errors.login} />
            </label>

            <label>
              Никнейм
              <Input
                type="text"
                name="display_name"
                placeholder="Никнейм"
                value={profile.display_name}
                onChange={handleChange}
                onBlur={handleBlur}
              />
              <FieldError message={profileValidate.errors.display_name} />
            </label>

            <div className="auth-form__actions">
              <Button
                type="submit"
                variant="primary"
                disabled={loading || profileValidate.isValidateError}
                className={
                  (profileValidate.isValidateError ? 'btn--disabled' : '') +
                  ' btn btn--primary'
                }>
                {loading ? 'Сохранение...' : 'Сохранить изменения'}
              </Button>
            </div>
          </form>

          <h3>Смена пароля</h3>
          <form
            className="auth-form auth-form--grid"
            onSubmit={handlePasswordChange}
            id="password-form"
            noValidate>
            <label>
              <Input
                type="password"
                placeholder="Старый пароль"
                name="oldPassword"
                value={passwords.oldPassword}
                onChange={e =>
                  setPasswords({ ...passwords, oldPassword: e.target.value })
                }
                onBlur={() => passwordsValidate.doValidate(passwords)}
              />
              <FieldError message={passwordsValidate.errors.oldPassword} />
              {!passwordsValidate.isValidateError &&
              passwords.newPassword !== passwords.oldPassword ? (
                <FieldError message="Пароли не совпадают" />
              ) : (
                ''
              )}
            </label>
            <label>
              <Input
                type="password"
                placeholder="Новый пароль"
                name="newPassword"
                value={passwords.newPassword}
                onChange={e =>
                  setPasswords({ ...passwords, newPassword: e.target.value })
                }
                onBlur={() => passwordsValidate.doValidate(passwords)}
              />
              <FieldError message={passwordsValidate.errors.newPassword} />
            </label>

            <div className="auth-form__actions">
              <Button
                type="submit"
                variant="primary"
                disabled={
                  passwordsValidate.isValidateError ||
                  passwords.newPassword !== passwords.oldPassword
                }
                className={
                  (passwordsValidate.isValidateError ||
                  passwords.newPassword !== passwords.oldPassword
                    ? 'btn--disabled'
                    : '') + ' btn btn--primary'
                }>
                Сменить пароль
              </Button>
            </div>
          </form>
        </section>
      </main>

      <Footer />
    </div>
  )
}

export const initProfilePage = (_args: PageInitArgs) => {
  console.log(_args)
  // позже здесь будет загрузку данных профиля из API
  return Promise.resolve()
}

/** Изменения и починка Sprint6 Chores
 * Avatar — вместо проверки только по размеру используем validateAvatarFile,
 * сообщения совпадают с профилем;
 * при ошибке инпут сбрасывается (e.target.value = '').
 * ProfilePage.handleSubmit — отправка на API только после успешной валидации
 * doValidate(profile, async () => { ... }), чтобы не уходил запрос при ошибках полей.
 **/
import React, { useEffect, useState } from 'react'
import { Helmet } from 'react-helmet'
import { Header } from '../components/Header'
import { Footer } from '../components/Footer'
import { Avatar } from '../components/Avatar'
import { usePage } from '../hooks/usePage'
import { PageInitArgs } from '../routes'
import {
  Button,
  Input,
  FieldError,
} from '../shared/ui'
import {
  userApi,
  ProfileData,
} from '../shared/api/userApi'
import { API_RESOURCES_URL } from '../constants'
// import { DEFAULT_AVATAR_PATH } from '../constants'
import { useValidate } from '../hooks/useValidate'
import { validateAvatarFile } from '../shared/validation/authValidation'
import { useLandingTheme } from '../contexts/LandingThemeContext'

export const ProfilePage: React.FC = () => {
  const { theme } = useLandingTheme()
  const [profile, setProfile] =
    useState<ProfileData>({
      first_name: '',
      second_name: '',
      display_name: '',
      email: '',
      phone: '',
      login: '',
    })
  const [passwords, setPasswords] = useState<{
    [key: string]: string
  }>({
    oldPassword: '',
    newPassword: '',
  })

  const [avatar, setAvatar] = useState<
    string | null
  >(null)
  const [loading, setLoading] = useState(false)

  const profileValidate = useValidate()
  const passwordsValidate = useValidate()

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const data = await userApi.getProfile()
        const next: ProfileData = {
          first_name: data.first_name || '',
          second_name: data.second_name || '',
          display_name: data.display_name || '',
          email: data.email || '',
          phone: data.phone || '',
          login: data.login || '',
        }
        setProfile(next)
        setAvatar(data.avatar)
        profileValidate.doValidate(next)
      } catch {
        console.log(
          'Не удалось загрузить профиль'
        )
      }
    }
    void loadProfile()
    passwordsValidate.doValidate({
      oldPassword: '',
      newPassword: '',
    })
  }, [])

  const handleChange: React.ChangeEventHandler<
    HTMLInputElement
  > = e => {
    const { name, value } = e.target
    setProfile(prev => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleBlur = () => {
    profileValidate.doValidate(profile)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    profileValidate.doValidate(
      profile,
      async () => {
        setLoading(true)
        try {
          await userApi.updateProfile(profile)
          console.log('Профиль обновлён')
        } catch {
          console.log('Ошибка обновления профиля')
        } finally {
          setLoading(false)
        }
      }
    )
  }

  const handlePasswordChange = async (
    e: React.FormEvent
  ) => {
    e.preventDefault()
    try {
      const { oldPassword, newPassword } =
        passwords
      await userApi.changePassword({
        oldPassword,
        newPassword,
      })
      console.log('Пароль изменён')
      setPasswords({
        oldPassword: '',
        newPassword: '',
      })
    } catch {
      console.log('Ошибка смены пароля')
    }
  }

  const handleAvatarChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0]
    if (!file) return
    const avatarErr = validateAvatarFile(file)
    if (avatarErr) {
      alert(avatarErr)
      e.target.value = ''
      return
    }
    try {
      const updated = await userApi.updateAvatar(
        file
      )
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
    <div
      className={`landing landing--${theme} AuthPage`}>
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
          <Avatar
            url={avatar}
            handleAvatarChange={
              handleAvatarChange
            }
            handleAvatarDelete={
              handleAvatarDelete
            }
          />

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
              <FieldError
                message={
                  profileValidate.errors
                    .first_name
                }
              />
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
              <FieldError
                message={
                  profileValidate.errors
                    .second_name
                }
              />
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
              <FieldError
                message={
                  profileValidate.errors.email
                }
              />
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
              <FieldError
                message={
                  profileValidate.errors.phone
                }
              />
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
              <FieldError
                message={
                  profileValidate.errors.login
                }
              />
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
              <FieldError
                message={
                  profileValidate.errors
                    .display_name
                }
              />
            </label>

            <div className="auth-form__actions">
              <Button
                type="submit"
                variant="primary"
                disabled={
                  loading ||
                  profileValidate.isValidateError
                }
                className={
                  (profileValidate.isValidateError
                    ? 'btn--disabled'
                    : '') + ' btn btn--primary'
                }>
                {loading
                  ? 'Сохранение...'
                  : 'Сохранить изменения'}
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
                  setPasswords({
                    ...passwords,
                    oldPassword: e.target.value,
                  })
                }
                onBlur={() =>
                  passwordsValidate.doValidate(
                    passwords
                  )
                }
              />
              <FieldError
                message={
                  passwordsValidate.errors
                    .oldPassword
                }
              />
              {!passwordsValidate.isValidateError &&
              passwords.newPassword !==
                passwords.oldPassword ? (
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
                  setPasswords({
                    ...passwords,
                    newPassword: e.target.value,
                  })
                }
                onBlur={() =>
                  passwordsValidate.doValidate(
                    passwords
                  )
                }
              />
              <FieldError
                message={
                  passwordsValidate.errors
                    .newPassword
                }
              />
            </label>

            <div className="auth-form__actions">
              <Button
                type="submit"
                variant="primary"
                disabled={
                  passwordsValidate.isValidateError ||
                  passwords.newPassword !==
                    passwords.oldPassword
                }
                className={
                  (passwordsValidate.isValidateError ||
                  passwords.newPassword !==
                    passwords.oldPassword
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

export const initProfilePage = (
  _args: PageInitArgs
) => {
  console.log(_args)
  // позже здесь будет загрузка данных профиля из API
  return Promise.resolve()
}

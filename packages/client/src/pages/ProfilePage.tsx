/** Изменения и починка Sprint6 Chores
 * Avatar — вместо проверки только по размеру используем validateAvatarFile,
 * сообщения совпадают с профилем;
 * при ошибке инпут сбрасывается (e.target.value = '').
 * ProfilePage.handleSubmit — отправка на API только после успешной валидации
 * doValidate(profile, async () => { ... }), чтобы не уходил запрос при ошибках полей.
 * Полный путь к аватару из API и обновление аватара с нормализацией URL
 * Починка замены аватара и его отображения после замены
 * Форма смены пароля после клика по ссылке "Сменить пароль"
 * Тостер и консоль-лог при успешном сохранении профиля и аватара
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
  ProfileResponse,
  resourceFileUrl,
} from '../shared/api/userApi'
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
  const [
    showPasswordPanel,
    setShowPasswordPanel,
  ] = useState(false)
  const [toastMessage, setToastMessage] =
    useState('')

  const profileValidate = useValidate()

  const notifyProfileSuccess = (
    message: string
  ) => {
    console.info('[Profile]', message)
    setToastMessage(message)
  }

  useEffect(() => {
    if (!toastMessage) return
    const id = window.setTimeout(() => {
      setToastMessage('')
    }, 2800)
    return () => window.clearTimeout(id)
  }, [toastMessage])
  const passwordsValidate = useValidate()

  const applyServerProfile = (
    data: ProfileResponse,
    opts?: { bustAvatar?: boolean }
  ) => {
    const next: ProfileData = {
      first_name: data.first_name || '',
      second_name: data.second_name || '',
      display_name: data.display_name || '',
      email: data.email || '',
      phone: data.phone || '',
      login: data.login || '',
    }
    setProfile(next)
    const base = resourceFileUrl(data.avatar)
    setAvatar(
      base && opts?.bustAvatar
        ? `${base.split('?')[0]}?v=${Date.now()}`
        : base
    )
    profileValidate.doValidate(next)
  }

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const data = await userApi.getProfile()
        applyServerProfile(data)
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
          const fresh = await userApi.getProfile()
          applyServerProfile(fresh)
          notifyProfileSuccess(
            'Изменения профиля сохранены'
          )
        } catch {
          console.warn(
            '[Profile]',
            'Не удалось сохранить профиль'
          )
        } finally {
          setLoading(false)
        }
      }
    )
  }

  const handlePasswordChange = (
    e: React.FormEvent
  ) => {
    e.preventDefault()
    passwordsValidate.doValidate(
      passwords,
      async () => {
        const { oldPassword, newPassword } =
          passwords
        if (newPassword === oldPassword) return
        try {
          await userApi.changePassword({
            oldPassword,
            newPassword,
          })
          notifyProfileSuccess(
            'Пароль успешно изменён'
          )
          setPasswords({
            oldPassword: '',
            newPassword: '',
          })
          setShowPasswordPanel(false)
          passwordsValidate.doValidate({
            oldPassword: '',
            newPassword: '',
          })
        } catch {
          console.warn(
            '[Profile]',
            'Не удалось сменить пароль'
          )
        }
      }
    )
  }

  const closePasswordPanel = () => {
    setShowPasswordPanel(false)
    setPasswords({
      oldPassword: '',
      newPassword: '',
    })
    passwordsValidate.doValidate({
      oldPassword: '',
      newPassword: '',
    })
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
      await userApi.updateAvatar(file)
      const fresh = await userApi.getProfile()
      applyServerProfile(fresh, {
        bustAvatar: true,
      })
      notifyProfileSuccess('Аватар обновлён')
    } catch {
      console.warn(
        '[Profile]',
        'Не удалось загрузить аватар'
      )
      alert('Ошибка загрузки аватара')
    }
  }

  const handleAvatarDelete = async () => {
    try {
      await userApi.deleteAvatar()
      const fresh = await userApi.getProfile()
      applyServerProfile(fresh)
      notifyProfileSuccess('Аватар удалён')
    } catch {
      console.warn(
        '[Profile]',
        'Не удалось удалить аватар'
      )
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
          {toastMessage ? (
            <div
              role="status"
              aria-live="polite"
              className="auth-page__toast-wrap">
              <div className="auth-page__toast">
                {toastMessage}
              </div>
            </div>
          ) : null}
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

          {!showPasswordPanel ? (
            <p className="auth-note profile-password-toggle">
              <button
                type="button"
                className="auth-link auth-link--as-button"
                onClick={() =>
                  setShowPasswordPanel(true)
                }>
                Сменить пароль
              </button>
            </p>
          ) : (
            <>
              <h3>Смена пароля</h3>
              <form
                className="auth-form auth-form--grid"
                onSubmit={handlePasswordChange}
                id="password-form"
                noValidate>
                <label>
                  Старый пароль
                  <Input
                    type="password"
                    placeholder="Старый пароль"
                    name="oldPassword"
                    value={passwords.oldPassword}
                    onChange={e =>
                      setPasswords({
                        ...passwords,
                        oldPassword:
                          e.target.value,
                      })
                    }
                    onBlur={() =>
                      passwordsValidate.doValidate(
                        passwords
                      )
                    }
                    autoComplete="current-password"
                  />
                  <FieldError
                    message={
                      passwordsValidate.errors
                        .oldPassword
                    }
                  />
                </label>
                <label>
                  Новый пароль
                  <Input
                    type="password"
                    placeholder="Новый пароль"
                    name="newPassword"
                    value={passwords.newPassword}
                    onChange={e =>
                      setPasswords({
                        ...passwords,
                        newPassword:
                          e.target.value,
                      })
                    }
                    onBlur={() =>
                      passwordsValidate.doValidate(
                        passwords
                      )
                    }
                    autoComplete="new-password"
                  />
                  <FieldError
                    message={
                      passwordsValidate.errors
                        .newPassword
                    }
                  />
                  {passwords.oldPassword.trim() !==
                    '' &&
                  passwords.newPassword.trim() !==
                    '' &&
                  passwords.newPassword ===
                    passwords.oldPassword ? (
                    <FieldError message="Новый пароль должен отличаться от текущего" />
                  ) : null}
                </label>

                <div className="auth-form__actions auth-form__actions--split">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={closePasswordPanel}>
                    Отмена
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    disabled={
                      passwordsValidate.isValidateError ||
                      passwords.newPassword ===
                        passwords.oldPassword ||
                      !passwords.oldPassword.trim() ||
                      !passwords.newPassword.trim()
                    }
                    className={
                      (passwordsValidate.isValidateError ||
                      passwords.newPassword ===
                        passwords.oldPassword ||
                      !passwords.oldPassword.trim() ||
                      !passwords.newPassword.trim()
                        ? 'btn--disabled'
                        : '') +
                      ' btn btn--primary'
                    }>
                    Сохранить пароль
                  </Button>
                </div>
              </form>
            </>
          )}
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

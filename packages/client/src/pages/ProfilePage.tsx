/** Интеграция с Redux:
 * - данные пользователя синхронизированы со стором
 * - профиль обновляется через updateProfileThunk
 * - аватар обновляется через updateAvatarThunk
 **/
import React, {
  useEffect,
  useRef,
  useState,
} from 'react'
import clsx from 'clsx'
import {
  useDispatch,
  useSelector,
} from 'react-redux'
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
import { useValidate } from '../hooks/useValidate'
import { validateAvatarFile } from '../shared/validation/authValidation'
import { useLandingTheme } from '../contexts/LandingThemeContext'
import { AppDispatch } from '../store'
import {
  selectUser,
  updateProfileThunk,
  updateAvatarThunk,
  patchUserProfile,
  updateUserAvatar,
  fetchUserThunk,
} from '../slices/userSlice'

function profilesEqual(
  a: ProfileData,
  b: ProfileData
): boolean {
  return (
    a.first_name === b.first_name &&
    a.second_name === b.second_name &&
    a.display_name === b.display_name &&
    a.email === b.email &&
    a.phone === b.phone &&
    a.login === b.login
  )
}

export const ProfilePage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>()
  const userFromStore = useSelector(selectUser)
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
  const [savedProfile, setSavedProfile] =
    useState<ProfileData | null>(null)
  const [pwdFieldBlurred, setPwdFieldBlurred] =
    useState({
      oldPassword: false,
      newPassword: false,
    })

  const passwordsRef = useRef(passwords)
  passwordsRef.current = passwords

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

  useEffect(() => {
    if (!userFromStore) {
      dispatch(fetchUserThunk())
    } else {
      const nextProfile: ProfileData = {
        first_name:
          userFromStore.first_name || '',
        second_name:
          userFromStore.second_name || '',
        display_name:
          userFromStore.display_name || '',
        email: userFromStore.email || '',
        phone: userFromStore.phone || '',
        login: userFromStore.login || '',
      }
      setProfile(nextProfile)
      const avatarUrl = userFromStore.avatar
        ? resourceFileUrl(userFromStore.avatar)
        : null
      setAvatar(avatarUrl)
      setSavedProfile({ ...nextProfile })
      profileValidate.doValidate(nextProfile)
    }
  }, [dispatch, userFromStore])

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
    setSavedProfile({ ...next })
    const base = resourceFileUrl(data.avatar)
    setAvatar(
      base && opts?.bustAvatar
        ? `${base.split('?')[0]}?v=${Date.now()}`
        : base
    )
    profileValidate.doValidate(next)

    dispatch(patchUserProfile(data))
  }

  const handleChange: React.ChangeEventHandler<
    HTMLInputElement
  > = e => {
    const { name, value } = e.target
    setProfile(prev => {
      return {
        ...prev,
        [name]: value,
      }
    })
  }

  const isProfileDirty =
    savedProfile !== null &&
    !profilesEqual(profile, savedProfile)

  const canSaveProfile =
    isProfileDirty &&
    !loading &&
    !profileValidate.isValidateError

  const handlePasswordFieldBlur = (
    field: 'oldPassword' | 'newPassword'
  ) => {
    setPwdFieldBlurred(prev => ({
      ...prev,
      [field]: true,
    }))
    passwordsValidate.handleFieldBlur(
      field,
      passwordsRef.current[field]
    )
  }

  const handleOldPasswordChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = e.target.value
    setPasswords(prev => {
      const next = { ...prev, oldPassword: value }
      passwordsRef.current = next
      return next
    })
    if (pwdFieldBlurred.oldPassword) {
      queueMicrotask(() => {
        passwordsValidate.doValidate(
          passwordsRef.current
        )
      })
    }
  }

  const handleNewPasswordChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = e.target.value
    setPasswords(prev => {
      const next = { ...prev, newPassword: value }
      passwordsRef.current = next
      return next
    })
    if (pwdFieldBlurred.newPassword) {
      queueMicrotask(() => {
        passwordsValidate.doValidate(
          passwordsRef.current
        )
      })
    }
  }

  const hasPasswordValidationErrors =
    Object.keys(passwordsValidate.errors).length >
    0

  const canSubmitPassword =
    Boolean(
      passwords.oldPassword.trim() &&
        passwords.newPassword.trim()
    ) &&
    passwords.newPassword !==
      passwords.oldPassword &&
    !hasPasswordValidationErrors

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    profileValidate.doValidate(
      profile,
      async () => {
        setLoading(true)
        try {
          const result = await dispatch(
            updateProfileThunk(profile)
          ).unwrap()
          applyServerProfile(result)
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
          setPwdFieldBlurred({
            oldPassword: false,
            newPassword: false,
          })
          passwordsValidate.resetValidation()
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
    setPwdFieldBlurred({
      oldPassword: false,
      newPassword: false,
    })
    passwordsValidate.resetValidation()
  }

  const openPasswordPanel = () => {
    setPwdFieldBlurred({
      oldPassword: false,
      newPassword: false,
    })
    passwordsValidate.resetValidation()
    setShowPasswordPanel(true)
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
      const result = await dispatch(
        updateAvatarThunk(file)
      ).unwrap()
      const base = resourceFileUrl(result.avatar)
      setAvatar(
        base
          ? `${
              base.split('?')[0]
            }?v=${Date.now()}`
          : null
      )
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
      dispatch(updateUserAvatar(''))
      setAvatar(null)
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
                onFocus={() =>
                  profileValidate.handleFieldFocus(
                    'first_name'
                  )
                }
                onBlur={e =>
                  profileValidate.handleFieldBlur(
                    'first_name',
                    e.target.value
                  )
                }
              />
              <FieldError
                message={profileValidate.getFieldError(
                  'first_name'
                )}
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
                onFocus={() =>
                  profileValidate.handleFieldFocus(
                    'second_name'
                  )
                }
                onBlur={e =>
                  profileValidate.handleFieldBlur(
                    'second_name',
                    e.target.value
                  )
                }
              />
              <FieldError
                message={profileValidate.getFieldError(
                  'second_name'
                )}
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
                onFocus={() =>
                  profileValidate.handleFieldFocus(
                    'email'
                  )
                }
                onBlur={e =>
                  profileValidate.handleFieldBlur(
                    'email',
                    e.target.value
                  )
                }
              />
              <FieldError
                message={profileValidate.getFieldError(
                  'email'
                )}
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
                onFocus={() =>
                  profileValidate.handleFieldFocus(
                    'phone'
                  )
                }
                onBlur={e =>
                  profileValidate.handleFieldBlur(
                    'phone',
                    e.target.value
                  )
                }
              />
              <FieldError
                message={profileValidate.getFieldError(
                  'phone'
                )}
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
                onFocus={() =>
                  profileValidate.handleFieldFocus(
                    'login'
                  )
                }
                onBlur={e =>
                  profileValidate.handleFieldBlur(
                    'login',
                    e.target.value
                  )
                }
              />
              <FieldError
                message={profileValidate.getFieldError(
                  'login'
                )}
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
                onFocus={() =>
                  profileValidate.handleFieldFocus(
                    'display_name'
                  )
                }
                onBlur={e =>
                  profileValidate.handleFieldBlur(
                    'display_name',
                    e.target.value
                  )
                }
              />
              <FieldError
                message={profileValidate.getFieldError(
                  'display_name'
                )}
              />
            </label>

            <div className="auth-form__actions auth-form__actions--profile-footer">
              <div className="auth-form__profile-footer-left">
                {!showPasswordPanel ? (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={openPasswordPanel}>
                    Сменить пароль
                  </Button>
                ) : null}
              </div>
              <Button
                type="submit"
                variant="primary"
                disabled={!canSaveProfile}
                className={clsx({
                  'btn--disabled':
                    !canSaveProfile,
                })}>
                {loading
                  ? 'Сохранение...'
                  : 'Сохранить изменения'}
              </Button>
            </div>
          </form>

          {showPasswordPanel ? (
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
                    onChange={
                      handleOldPasswordChange
                    }
                    onFocus={() =>
                      passwordsValidate.handleFieldFocus(
                        'oldPassword'
                      )
                    }
                    onBlur={() =>
                      handlePasswordFieldBlur(
                        'oldPassword'
                      )
                    }
                    autoComplete="current-password"
                  />
                  <FieldError
                    message={passwordsValidate.getFieldError(
                      'oldPassword'
                    )}
                  />
                </label>
                <label>
                  Новый пароль
                  <Input
                    type="password"
                    placeholder="Новый пароль"
                    name="newPassword"
                    value={passwords.newPassword}
                    onChange={
                      handleNewPasswordChange
                    }
                    onFocus={() =>
                      passwordsValidate.handleFieldFocus(
                        'newPassword'
                      )
                    }
                    onBlur={() =>
                      handlePasswordFieldBlur(
                        'newPassword'
                      )
                    }
                    autoComplete="new-password"
                  />
                  <FieldError
                    message={passwordsValidate.getFieldError(
                      'newPassword'
                    )}
                  />
                  {pwdFieldBlurred.oldPassword &&
                  pwdFieldBlurred.newPassword &&
                  passwords.oldPassword.trim() !==
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
                    disabled={!canSubmitPassword}
                    className={clsx({
                      'btn--disabled':
                        !canSubmitPassword,
                    })}>
                    Сохранить пароль
                  </Button>
                </div>
              </form>
            </>
          ) : null}
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

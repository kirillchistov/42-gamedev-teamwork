import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../../shared/ui'
import {
  useDispatch,
  useSelector,
} from '../../store'
import {
  logoutThunk,
  selectUser,
  selectUserIsLoading,
} from '../../slices/userSlice'

type AuthSessionNoticeProps = {
  actionLabel: string
}

export const AuthSessionNotice: React.FC<
  AuthSessionNoticeProps
> = ({ actionLabel }) => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const user = useSelector(selectUser)
  const isLoading = useSelector(
    selectUserIsLoading
  )

  if (!user) {
    return null
  }

  const fullName = [
    user.first_name,
    user.second_name,
  ]
    .filter(Boolean)
    .join(' ')

  const handleLogout = async () => {
    const result = await dispatch(logoutThunk())

    if (logoutThunk.fulfilled.match(result)) {
      navigate('/login', { replace: true })
    }
  }

  return (
    <section className="auth-card auth-card--wide">
      <h1>Вы уже вошли в систему</h1>
      <p className="auth-note">
        Сейчас активен аккаунт{' '}
        {fullName || user.login}. Из соображений
        безопасности мы не разлогиниваем вас
        автоматически.
      </p>
      <div className="auth-form__actions">
        <Button
          type="button"
          variant="primary"
          onClick={() => navigate('/profile')}>
          Открыть профиль
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => navigate('/')}>
          На главную
        </Button>
        <Button
          type="button"
          variant="flat"
          onClick={handleLogout}
          disabled={isLoading}>
          {isLoading ? 'Выходим...' : actionLabel}
        </Button>
      </div>
    </section>
  )
}

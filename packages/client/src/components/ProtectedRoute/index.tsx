import React, { useEffect } from 'react'
import { Navigate } from 'react-router-dom'
import {
  useDispatch,
  useSelector,
} from '../../store'
import {
  fetchUserThunk,
  selectUser,
  selectUserIsAuthChecked,
  selectUserIsLoading,
} from '../../slices/userSlice'

interface ProtectedRouteProps {
  children: React.ReactNode
  redirectTo?: string
}

export const ProtectedRoute: React.FC<
  ProtectedRouteProps
> = ({ children, redirectTo = '/login' }) => {
  const dispatch = useDispatch()
  const user = useSelector(selectUser)
  const isAuthChecked = useSelector(
    selectUserIsAuthChecked
  )
  const isLoading = useSelector(
    selectUserIsLoading
  )

  useEffect(() => {
    if (!isAuthChecked && !isLoading) {
      dispatch(fetchUserThunk())
    }
  }, [dispatch, isAuthChecked, isLoading])

  if (!isAuthChecked) {
    return (
      <div className="landing landing--light-flat">
        <main className="auth-main">
          <section className="auth-card auth-card--wide">
            <p>Проверяем авторизацию...</p>
          </section>
        </main>
      </div>
    )
  }

  if (!user) {
    return <Navigate to={redirectTo} replace />
  }

  return <>{children}</>
}

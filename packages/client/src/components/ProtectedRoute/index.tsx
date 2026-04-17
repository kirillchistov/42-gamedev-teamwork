// Редирект неавторизованных с закрытых маршрутов.
import React, { useEffect, useRef } from 'react'
import { Navigate } from 'react-router-dom'
import {
  useDispatch,
  useSelector,
} from '../../store'
import {
  fetchUserThunk,
  selectUser,
  selectUserIsInitialized,
  selectUserIsLoading,
} from '../../slices/userSlice'

interface ProtectedRouteProps {
  children: React.ReactNode
}

/**
 * Защита маршрутов: один запрос /auth/user до проверки isInitialized,
 * затем редирект на /login.
 */
export const ProtectedRoute: React.FC<
  ProtectedRouteProps
> = ({ children }) => {
  const dispatch = useDispatch()
  const user = useSelector(selectUser)
  const isInitialized = useSelector(
    selectUserIsInitialized
  )
  const isLoading = useSelector(
    selectUserIsLoading
  )

  const authRequestSent = useRef(false)

  useEffect(() => {
    if (isInitialized) {
      authRequestSent.current = false
      return
    }
    if (isLoading) return
    if (authRequestSent.current) return
    authRequestSent.current = true
    void dispatch(fetchUserThunk())
  }, [dispatch, isInitialized, isLoading])

  if (!isInitialized || isLoading) {
    return (
      <div
        className="protected-route__loading"
        role="status"
        aria-live="polite"
        aria-busy="true">
        <p className="protected-route__loading-text">
          Проверяем авторизацию…
        </p>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

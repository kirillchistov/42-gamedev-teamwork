import React, { useEffect } from 'react'
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

  useEffect(() => {
    if (!isInitialized && !isLoading) {
      void dispatch(fetchUserThunk())
    }
  }, [dispatch, isInitialized, isLoading])

  if (!isInitialized || isLoading) {
    return null
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

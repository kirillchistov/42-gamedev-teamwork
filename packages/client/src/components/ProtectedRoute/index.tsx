import React from 'react'
import { Navigate } from 'react-router-dom'
import { useSelector } from '../../store'
import { selectUser } from '../../slices/userSlice'

interface ProtectedRouteProps {
  children: React.ReactNode
}

export const ProtectedRoute: React.FC<
  ProtectedRouteProps
> = ({ children }) => {
  const user = useSelector(selectUser)

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

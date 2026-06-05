// Этот хук читает user, isAuthChecked, isLoading из Redux;
// Если сессия еще не проверена и не идет загрузка — диспатчит fetchUserThunk;
// возвращает статус: loading | allowed | denied

import { useEffect, useRef } from 'react'
import { useDispatch, useSelector } from '../store'
import {
  fetchUserThunk,
  selectUser,
  selectUserIsAuthChecked,
  selectUserIsLoading,
} from '../slices/userSlice'
import { selectPageHasBeenInitializedOnServer } from '../slices/ssrSlice'

export type AuthGuardStatus = 'loading' | 'allowed' | 'denied'

export const useAuthGuard = (): AuthGuardStatus => {
  const dispatch = useDispatch()
  const user = useSelector(selectUser)
  const isAuthChecked = useSelector(selectUserIsAuthChecked)
  const isLoading = useSelector(selectUserIsLoading)
  const pageInitOnServer = useSelector(selectPageHasBeenInitializedOnServer)
  const fetchRequestedRef = useRef(false)

  useEffect(() => {
    if (isAuthChecked) {
      fetchRequestedRef.current = false
      return
    }
    if (isLoading || fetchRequestedRef.current) {
      return
    }
    fetchRequestedRef.current = true
    void dispatch(fetchUserThunk())
  }, [dispatch, isAuthChecked, isLoading])

  const showLoading =
    !isAuthChecked || (isLoading && !(pageInitOnServer && isAuthChecked))

  if (showLoading) {
    return 'loading'
  }

  return user ? 'allowed' : 'denied'
}

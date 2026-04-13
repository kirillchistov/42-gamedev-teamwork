// Этот хук читает user, isAuthChecked, isLoading из Redux;
// Если сессия еще не проверена и не идет загрузка — диспатчит fetchUserThunk;
// возвращает статус: loading | allowed | denied

import { useEffect } from 'react'
import {
  useDispatch,
  useSelector,
} from '../store'
import {
  fetchUserThunk,
  selectUser,
  selectUserIsAuthChecked,
  selectUserIsLoading,
} from '../slices/userSlice'

export type AuthGuardStatus =
  | 'loading'
  | 'allowed'
  | 'denied'

export const useAuthGuard =
  (): AuthGuardStatus => {
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
        void dispatch(fetchUserThunk())
      }
    }, [dispatch, isAuthChecked, isLoading])

    if (!isAuthChecked || isLoading) {
      return 'loading'
    }

    return user ? 'allowed' : 'denied'
  }

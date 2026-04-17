// 'useAuthCheck' — проверка сессии / пользователя
import { useEffect } from 'react'
import {
  useDispatch,
  useSelector,
} from 'react-redux'
import {
  fetchUserThunk,
  selectUserIsAuthChecked,
} from '../slices/userSlice'
import { AppDispatch } from '../store'

export const useAuthCheck = () => {
  const dispatch = useDispatch<AppDispatch>()
  const isAuthChecked = useSelector(
    selectUserIsAuthChecked
  )

  useEffect(() => {
    if (!isAuthChecked) {
      dispatch(fetchUserThunk())
    }
  }, [dispatch, isAuthChecked])

  return isAuthChecked
}

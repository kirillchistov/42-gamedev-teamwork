import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'

import { useSelector } from '../../store'
import { selectUser } from '../../slices/userSlice'
import { usePresentationLeave } from './PresentationNavContext'

/** SPA-навигация из презентации (без window.open — ломает GH Pages / iOS). */
export function usePresentationNavigation() {
  const navigate = useNavigate()
  const user = useSelector(selectUser)
  const leavePresentation = usePresentationLeave()

  const goToPlay = useCallback(() => {
    leavePresentation?.()
    navigate(user ? '/game/start' : '/login')
  }, [leavePresentation, navigate, user])

  const goToSignupOrAbout = useCallback(() => {
    leavePresentation?.()
    navigate(user ? '/presentation' : '/signup')
  }, [leavePresentation, navigate, user])

  return {
    goToPlay,
    goToSignupOrAbout,
    playLabel: 'Играть',
    signupCtaText: user ? 'О проекте' : 'Зарегистрироваться',
    gameCtaText: user ? 'Запустить игру' : 'Войти в игру',
  }
}

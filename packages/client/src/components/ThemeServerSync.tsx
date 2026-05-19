import { useThemeServerSync } from '../hooks/useThemeServerSync'

// Подключаем синк темы с Node API после проверки сессии
export function ThemeServerSync(): null {
  useThemeServerSync()
  return null
}

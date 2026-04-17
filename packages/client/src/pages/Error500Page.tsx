import { usePage } from '../hooks/usePage'
import { AppErrorFallback } from '../components/AppErrorFallback'

export const Error500Page = () => {
  usePage({ initPage: initError500Page })
  return <AppErrorFallback />
}

export const initError500Page = () =>
  Promise.resolve()

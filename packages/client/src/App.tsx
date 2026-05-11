import { useSelector } from './store'

import { selectUser } from './slices/userSlice'

const App = () => {
  const user = useSelector(selectUser)

  return (
    <div>
      {user ? (
        <div>
          <p>{user.first_name}</p>
          <p>{user.second_name}</p>
        </div>
      ) : (
        <p>Пользователь не найден!</p>
      )}
    </div>
  )
}

export default App

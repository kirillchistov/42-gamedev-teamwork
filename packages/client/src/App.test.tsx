// Заменил текст-заглушку appContent на проверку пользователя в сторе
import React from 'react'
import App from './App'
import { render, screen } from '@testing-library/react'
import { Provider } from 'react-redux'
import { store } from './store'

// const appContent = 'Вот тут будет жить ваше приложение :)'

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
global.fetch = jest.fn(() =>
  Promise.resolve({ json: () => Promise.resolve('hey') })
)

// test('Example test', async () => {
//   render(
//     <Provider store={store}>
//       <App />
//     </Provider>
//   )
//   expect(screen.getByText(appContent)).toBeDefined()
// })

test('renders fallback when user is not found', () => {
  render(
    <Provider store={store}>
      <App />
    </Provider>
  )

  expect(screen.getByText('Пользователь не найден!')).toBeInTheDocument()
})

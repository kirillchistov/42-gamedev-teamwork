import React from 'react'
import {
  render,
  screen,
} from '@testing-library/react'
import { Provider } from 'react-redux'
import {
  createMemoryRouter,
  RouterProvider,
} from 'react-router-dom'
import { store } from '../store'
import { LandingThemeProvider } from '../contexts/LandingThemeContext'
import { ErrorBoundary } from './ErrorBoundary'
import { AppErrorFallback } from './AppErrorFallback'

const ThrowOnRender = () => {
  throw new Error('Render crash for boundary')
}

const AppProviders: React.FC<{
  children: React.ReactNode
}> = ({ children }) => (
  <Provider store={store}>
    <LandingThemeProvider>
      {children}
    </LandingThemeProvider>
  </Provider>
)

describe('Unified app error fallback', () => {
  const originalError = console.error

  beforeAll(() => {
    console.error = jest.fn()
  })

  afterAll(() => {
    console.error = originalError
  })

  test('shows the same fallback via ErrorBoundary', () => {
    render(
      <AppProviders>
        <ErrorBoundary>
          <ThrowOnRender />
        </ErrorBoundary>
      </AppProviders>
    )

    expect(
      screen.getByText(
        'Космическая турбулентность'
      )
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', {
        name: 'На главную',
      })
    ).toBeInTheDocument()
  })

  test('shows the same fallback via react-router errorElement', async () => {
    const router = createMemoryRouter([
      {
        path: '/',
        element: <ThrowOnRender />,
        errorElement: <AppErrorFallback />,
      },
    ])

    render(
      <AppProviders>
        <RouterProvider router={router} />
      </AppProviders>
    )

    expect(
      await screen.findByText(
        'Космическая турбулентность'
      )
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', {
        name: 'На главную',
      })
    ).toBeInTheDocument()
  })
})

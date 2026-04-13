import React from 'react'
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react'
import { ProfilePage } from './ProfilePage'

const mockDispatch = jest.fn()
const mockUseSelector = jest.fn()
const mockUserState = {
  user: {
    data: {
      id: 1,
      first_name: 'Иван',
      second_name: 'Иванов',
      display_name: 'Vanya',
      email: 'ivan@example.com',
      phone: '+79991234567',
      login: 'ivan_login',
      avatar: null,
    },
  },
}

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useDispatch: () => mockDispatch,
  useSelector: (
    selector: (state: unknown) => unknown
  ) => mockUseSelector(selector),
}))

jest.mock('../hooks/usePage', () => ({
  usePage: jest.fn(),
}))

jest.mock(
  '../contexts/LandingThemeContext',
  () => ({
    useLandingTheme: () => ({
      theme: 'light-flat',
    }),
  })
)

jest.mock('../components/Header', () => ({
  Header: () => <div data-testid="header" />,
}))

jest.mock('../components/Footer', () => ({
  Footer: () => <div data-testid="footer" />,
}))

jest.mock('../components/Avatar', () => ({
  Avatar: () => <div data-testid="avatar" />,
}))

describe('ProfilePage blur validation regression', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUseSelector.mockImplementation(
      (selector: (state: unknown) => unknown) =>
        selector(mockUserState)
    )
  })

  test('clears email error after valid value on blur', async () => {
    render(<ProfilePage />)

    const emailInput =
      screen.getByPlaceholderText(
        'user@example.com'
      ) as HTMLInputElement

    act(() => {
      fireEvent.change(emailInput, {
        target: { value: 'invalid-email' },
      })
      fireEvent.blur(emailInput)
    })

    expect(
      await screen.findByText(
        'Неверный формат почты'
      )
    ).toBeInTheDocument()

    act(() => {
      fireEvent.change(emailInput, {
        target: { value: 'valid@example.com' },
      })
      fireEvent.blur(emailInput)
    })

    await waitFor(() => {
      expect(
        screen.queryByText(
          'Неверный формат почты'
        )
      ).not.toBeInTheDocument()
    })
  })
})

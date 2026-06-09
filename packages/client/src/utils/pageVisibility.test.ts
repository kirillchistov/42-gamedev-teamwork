import { subscribePageVisibility } from './pageVisibility'

describe('subscribePageVisibility', () => {
  it('calls listener and unsubscribes', () => {
    const onChange = jest.fn()
    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      get: () => 'visible',
    })

    const unsub = subscribePageVisibility(onChange)
    expect(onChange).toHaveBeenCalledWith(false)

    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      get: () => 'hidden',
    })
    document.dispatchEvent(new Event('visibilitychange'))
    expect(onChange).toHaveBeenCalledWith(true)

    unsub()
    onChange.mockClear()
    document.dispatchEvent(new Event('visibilitychange'))
    expect(onChange).not.toHaveBeenCalled()
  })
})

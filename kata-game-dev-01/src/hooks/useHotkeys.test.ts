import { describe, it, expect, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useHotkeys } from './useHotkeys'

const fireKey = (key: string) =>
  window.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }))

describe('useHotkeys', () => {
  it('calls handler for registered key', () => {
    const handler = vi.fn()
    renderHook(() => useHotkeys({ i: handler }))
    act(() => fireKey('i'))
    expect(handler).toHaveBeenCalledTimes(1)
  })

  it('lowercases the key before matching (Escape → escape)', () => {
    const handler = vi.fn()
    renderHook(() => useHotkeys({ escape: handler }))
    act(() => fireKey('Escape'))
    expect(handler).toHaveBeenCalledTimes(1)
  })

  it('does not call handler for unregistered key', () => {
    const handler = vi.fn()
    renderHook(() => useHotkeys({ i: handler }))
    act(() => fireKey('e'))
    expect(handler).not.toHaveBeenCalled()
  })

  it('always uses the latest handler without re-registering the listener', () => {
    const handler1 = vi.fn()
    const handler2 = vi.fn()
    const { rerender } = renderHook(
      ({ h }) => useHotkeys({ i: h }),
      { initialProps: { h: handler1 } }
    )
    rerender({ h: handler2 })
    act(() => fireKey('i'))
    expect(handler1).not.toHaveBeenCalled()
    expect(handler2).toHaveBeenCalledTimes(1)
  })

  it('passes the KeyboardEvent to the handler', () => {
    const handler = vi.fn()
    renderHook(() => useHotkeys({ i: handler }))
    act(() => fireKey('i'))
    expect(handler).toHaveBeenCalledWith(expect.any(KeyboardEvent))
  })

  it('does not attach listener when enabled=false', () => {
    const handler = vi.fn()
    renderHook(() => useHotkeys({ i: handler }, false))
    act(() => fireKey('i'))
    expect(handler).not.toHaveBeenCalled()
  })

  it('removes listener on unmount', () => {
    const handler = vi.fn()
    const { unmount } = renderHook(() => useHotkeys({ i: handler }))
    unmount()
    act(() => fireKey('i'))
    expect(handler).not.toHaveBeenCalled()
  })

  it('supports multiple keys in the same map', () => {
    const handlerI = vi.fn()
    const handlerE = vi.fn()
    renderHook(() => useHotkeys({ i: handlerI, e: handlerE }))
    act(() => { fireKey('i'); fireKey('e') })
    expect(handlerI).toHaveBeenCalledTimes(1)
    expect(handlerE).toHaveBeenCalledTimes(1)
  })

  it('attaches listener when enabled changes from false to true', () => {
    const handler = vi.fn()
    const { rerender } = renderHook(
      ({ enabled }) => useHotkeys({ i: handler }, enabled),
      { initialProps: { enabled: false } }
    )
    act(() => fireKey('i'))
    expect(handler).not.toHaveBeenCalled()

    rerender({ enabled: true })
    act(() => fireKey('i'))
    expect(handler).toHaveBeenCalledTimes(1)
  })
})

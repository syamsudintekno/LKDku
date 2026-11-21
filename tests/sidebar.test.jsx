import React from 'react'
import { it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Provider } from 'react-redux'
import { MemoryRouter } from 'react-router-dom'
import AppSidebar from '../src/components/AppSidebar'
import store from '../src/store'

vi.mock('@coreui/react', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    CSidebar: React.forwardRef(function TestSidebar(props, ref) {
      return (
        <aside ref={ref}>
          <button onClick={() => props.onVisibleChange(false)}>Viewport hidden</button>
          <button onClick={() => props.onVisibleChange(true)}>Viewport visible</button>
        </aside>
      )
    }),
  }
})
function open(mobile) {
  store.dispatch({ type: 'set', sidebarShow: true })
  vi.spyOn(window, 'getComputedStyle').mockReturnValue({
    getPropertyValue: () => (mobile ? '1' : ''),
  })
  render(
    <Provider store={store}>
      <MemoryRouter>
        <AppSidebar />
      </MemoryRouter>
    </Provider>,
  )
}
it('desktop viewport observations do not feed back into requested visibility', () => {
  open(false)
  fireEvent.click(screen.getByRole('button', { name: 'Viewport hidden' }))
  expect(store.getState().sidebarShow).toBe(true)
})
it('mobile close synchronizes once and entering the viewport never reopens a closed menu', () => {
  open(true)
  fireEvent.click(screen.getByRole('button', { name: 'Viewport hidden' }))
  expect(store.getState().sidebarShow).toBe(false)
  fireEvent.click(screen.getByRole('button', { name: 'Viewport visible' }))
  expect(store.getState().sidebarShow).toBe(false)
})

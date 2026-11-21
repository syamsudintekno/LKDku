import { it, expect, vi } from 'vitest'
import { downloadText } from '../src/components/ui/downloadFile'
it('creates a typed local download and releases its object URL', () => {
  vi.useFakeTimers()
  const oldCreate = URL.createObjectURL,
    oldRevoke = URL.revokeObjectURL
  const create = vi.fn(() => 'blob:test-only'),
    revoke = vi.fn(),
    clicked = []
  URL.createObjectURL = create
  URL.revokeObjectURL = revoke
  vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function () {
    clicked.push({ name: this.download, href: this.href })
  })
  try {
    downloadText('fake-backup.json', '{"schemaVersion":1}', 'application/json')
    expect(create.mock.calls[0][0].type).toBe('application/json')
    expect(create.mock.calls[0][0].size).toBe(19)
    expect(clicked).toEqual([{ name: 'fake-backup.json', href: 'blob:test-only' }])
    vi.advanceTimersByTime(1000)
    expect(revoke).toHaveBeenCalledWith('blob:test-only')
  } finally {
    URL.createObjectURL = oldCreate
    URL.revokeObjectURL = oldRevoke
    vi.useRealTimers()
  }
})

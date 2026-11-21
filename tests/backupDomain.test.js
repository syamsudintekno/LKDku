import { it, expect } from 'vitest'
import { toBackupCsv, planBackupImport } from '../src/domain/backup'
it('escapes CSV cells and neutralizes formula prefixes including whitespace', () => {
  expect(toBackupCsv(['text'], [{ text: ' =HYPERLINK("x")' }])).toContain("' =HYPERLINK")
  expect(toBackupCsv(['text'], [{ text: 'a,b\nc' }])).toContain('"a,b\nc"')
})
it('previews an additive, idempotent restore and rejects changed existing records', () => {
  const document = {
    schemaVersion: 1,
    tables: { activity: [{ id: 'a', deskripsi: 'Uji', deleted: 0 }] },
  }
  const first = planBackupImport(
    document,
    { activity: [] },
    { activity: ['id', 'deskripsi', 'deleted'] },
  )
  expect(first.count).toBe(1)
  expect(
    planBackupImport(
      document,
      { activity: document.tables.activity },
      { activity: ['id', 'deskripsi', 'deleted'] },
    ).count,
  ).toBe(0)
  expect(() =>
    planBackupImport(
      document,
      { activity: [{ id: 'a', deskripsi: 'Diubah', deleted: 0 }] },
      { activity: ['id', 'deskripsi', 'deleted'] },
    ),
  ).toThrow(/berbeda/)
})
it('rejects unknown fields, duplicate identities, credentials and formula cells', () => {
  const schemas = { activity: ['id', 'deskripsi'] }
  for (const document of [
    { schemaVersion: 1, tables: { users: [] } },
    { schemaVersion: 1, tables: { activity: [{ id: 'a', password_hash: 'x' }] } },
    { schemaVersion: 1, tables: { activity: [{ id: 'a', deskripsi: '=1' }] } },
    { schemaVersion: 1, tables: { activity: [{ id: 'a' }, { id: 'a' }] } },
  ])
    expect(() => planBackupImport(document, { activity: [] }, schemas)).toThrow()
})

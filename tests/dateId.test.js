import { describe, it, expect } from 'vitest'
import { formatTableDate, formatSignatureDate, formatTimeRange } from '../src/domain/dateId'

describe('Domain DateId (AGENTS.md §7 & §11)', () => {
  it('memformat tanggal tabel dengan nama hari dan dd/MM/yyyy', () => {
    expect(formatTableDate('2026-10-01')).toBe('Kamis, 01/10/2026')
    expect(formatTableDate('2026-11-19')).toBe('Kamis, 19/11/2026')
    expect(formatTableDate('2026-10-31')).toBe('Sabtu, 31/10/2026')
  })

  it('memformat tanggal tanda tangan: Kota, tanggal Bulan Tahun', () => {
    expect(formatSignatureDate('2026-10-31', 'Kediri')).toBe('Kediri, 31 Oktober 2026')
    expect(formatSignatureDate('2026-09-30', 'Kediri')).toBe('Kediri, 30 September 2026')
    expect(formatSignatureDate('2026-11-30', 'Kediri')).toBe('Kediri, 30 November 2026')
  })

  it('memformat rentang waktu dengan titik dan en-dash (07.00–09.30)', () => {
    expect(formatTimeRange('07:00', '09:30')).toBe('07.00–09.30')
    expect(formatTimeRange('09:30', '12:00')).toBe('09.30–12.00')
  })
})

// Generated from src/domain/dateId.js. Run node scripts/sync-domain.mjs.
/**
 * dateId.js - Pemformatan tanggal, waktu, dan penanggalan resmi Indonesia (AGENTS.md §7)
 */

const HARI_INDONESIA = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']

const BULAN_INDONESIA = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
]

/**
 * Format tanggal untuk tabel LKB: Kamis, 01/10/2026
 * @param {string|Date} dateInput ISO string 'yyyy-MM-dd' atau objek Date
 */
function formatTableDate(dateInput) {
  if (!dateInput) return ''
  const date = typeof dateInput === 'string' ? parseIsoDate(dateInput) : dateInput
  if (isNaN(date.getTime())) return ''

  const dayName = HARI_INDONESIA[date.getDay()]
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = date.getFullYear()

  return `${dayName}, ${day}/${month}/${year}`
}

/**
 * Format tanggal untuk blok tanda tangan: Kediri, 31 Oktober 2026
 * @param {string|Date} dateInput
 * @param {string} city
 */
function formatSignatureDate(dateInput, city = 'Kediri') {
  if (!dateInput) return ''
  const date = typeof dateInput === 'string' ? parseIsoDate(dateInput) : dateInput
  if (isNaN(date.getTime())) return ''

  const day = date.getDate()
  const monthName = BULAN_INDONESIA[date.getMonth()]
  const year = date.getFullYear()

  return `${city}, ${day} ${monthName} ${year}`
}

/**
 * Format rentang waktu: 07.00–09.30 (titik sebagai pemisah jam:menit, en-dash pemisah rentang)
 * @param {string} start
 * @param {string} end
 */
function formatTimeRange(start, end) {
  if (!start && !end) return ''
  const formatTime = (t) => (t || '').replace(':', '.')
  if (start && end) {
    return `${formatTime(start)}–${formatTime(end)}`
  }
  return formatTime(start || end)
}

function parseIsoDate(str) {
  const parts = str.split('-')
  if (parts.length === 3) {
    return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]))
  }
  return new Date(str)
}

function currentJakartaYear() {
  return Number(
    new Intl.DateTimeFormat('en', { timeZone: 'Asia/Jakarta', year: 'numeric' }).format(new Date()),
  )
}
function formatDateTimeId(value) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return (
    new Intl.DateTimeFormat('id-ID', {
      dateStyle: 'medium',
      timeStyle: 'short',
      timeZone: 'Asia/Jakarta',
    }).format(date) + ' WIB'
  )
}

function currentJakartaDate() {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en', {
      timeZone: 'Asia/Jakarta',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    })
      .formatToParts(new Date())
      .filter((part) => part.type !== 'literal')
      .map((part) => [part.type, part.value]),
  )
  return `${parts.year}-${parts.month}-${parts.day}`
}

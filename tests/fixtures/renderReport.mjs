import { readFileSync } from 'node:fs'
import { runInNewContext } from 'node:vm'

// Test-only approximation of Apps Script scriptlets. Dynamic data is always escaped;
// only the checked-in template supplies executable code, never user content.
export function renderReportTemplate(data) {
  const template = readFileSync(
    new URL('../../apps-script/reportTemplate.html', import.meta.url),
    'utf8',
  )
  const escape = (value) =>
    String(value ?? '').replace(
      /[&<>"']/g,
      (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char],
    )
  let source = 'let output="";\n',
    offset = 0
  for (const part of template.matchAll(/<\?([\s\S]*?)\?>/g)) {
    source += `output+=${JSON.stringify(template.slice(offset, part.index))};\n`
    source += part[1].startsWith('=') ? `output+=escape(${part[1].slice(1)});\n` : part[1] + '\n'
    offset = part.index + part[0].length
  }
  source += `output+=${JSON.stringify(template.slice(offset))};\noutput`
  return runInNewContext(source, { ...data, escape }, { timeout: 1000 })
}

import { readFileSync, writeFileSync } from 'node:fs'
const source = readFileSync(new URL('../src/domain/templateSchedule.js', import.meta.url), 'utf8')
writeFileSync(
  new URL('../apps-script/schedule.gs', import.meta.url),
  '// Generated from src/domain/templateSchedule.js. Run node scripts/sync-domain.mjs.\n' +
    source.replaceAll('export function ', 'function '),
)

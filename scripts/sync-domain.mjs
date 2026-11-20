import { readFileSync, writeFileSync } from 'node:fs'
for (const [name, port] of [
  ['templateSchedule', 'schedule'],
  ['dateId', 'dateDomain'],
  ['activity', 'activityDomain'],
  ['activityDays', 'activityDays'],
  ['plan', 'planDomain'],
]) {
  const source = readFileSync(new URL(`../src/domain/${name}.js`, import.meta.url), 'utf8')
  const body = source
    .replace(/^import .+ from ['"].+['"]\r?\n/gm, '')
    .replaceAll('export function ', 'function ')
    .replaceAll('export const ', 'const ')
  writeFileSync(
    new URL(`../apps-script/${port}.gs`, import.meta.url),
    `// Generated from src/domain/${name}.js. Run node scripts/sync-domain.mjs.\n` + body,
  )
}

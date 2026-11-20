import { readFileSync, writeFileSync } from 'node:fs'
for (const [name, port] of [
  ['templateSchedule', 'schedule'],
  ['dateId', 'dateDomain'],
  ['activity', 'activityDomain'],
  ['activityDays', 'activityDays'],
  ['plan', 'planDomain'],
  ['report', 'reportDomain'],
  ['dashboard', 'dashboardDomain'],
  ['backup', 'backupDomain'],
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
const reportStyles = readFileSync(
  new URL('../src/views/laporan/report.css', import.meta.url),
  'utf8',
)
const reportTemplate = new URL('../apps-script/report.html', import.meta.url)
writeFileSync(
  reportTemplate,
  readFileSync(reportTemplate, 'utf8').replace(
    /<style>[\s\S]*?<\/style>/,
    `<style>\n${reportStyles}\n</style>`,
  ),
)

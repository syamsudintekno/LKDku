// @vitest-environment node
import { it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { createContext, runInContext } from 'node:vm'
import fixture from './fixtures/activity.json'
import { generateDraftPlan } from '../src/domain/plan'
import { buildActivityDays } from '../src/domain/activityDays'

it('port domain Apps Script tetap identik dan memakai fixture M2 yang sama', () => {
  const context = createContext({})
  for (const [name, port] of [
    ['templateSchedule', 'schedule'],
    ['dateId', 'dateDomain'],
    ['activity', 'activityDomain'],
    ['activityDays', 'activityDays'],
    ['plan', 'planDomain'],
  ]) {
    const source = readFileSync(new URL(`../src/domain/${name}.js`, import.meta.url), 'utf8')
    const expected =
      `// Generated from src/domain/${name}.js. Run node scripts/sync-domain.mjs.\n` +
      source
        .replace(/^import .+ from ['"].+['"]\r?\n/gm, '')
        .replaceAll('export function ', 'function ')
        .replaceAll('export const ', 'const ')
    const body = readFileSync(new URL(`../apps-script/${port}.gs`, import.meta.url), 'utf8')
    expect(body).toBe(expected)
    runInContext(body, context)
  }
  const input = { ...fixture, holidays: [], activities: [] }
  expect(JSON.parse(JSON.stringify(context.generateDraftPlan(input)))).toEqual(
    generateDraftPlan(input),
  )
  expect(
    JSON.parse(JSON.stringify(context.buildActivityDays('2026-10', [fixture.activity], []))),
  ).toEqual(buildActivityDays('2026-10', [fixture.activity], []))
})

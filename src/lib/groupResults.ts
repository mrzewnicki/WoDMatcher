import type { MatchResult } from '../types'
import { entryTypeOf, type EntryTypeFilter } from './filterResults'

export type GroupByMode = 'none' | 'discipline' | 'typeLevel'

export type ResultSection = {
  id: string
  title: string
  count: number
  subsections?: ResultSection[]
  results?: MatchResult[]
}

const TYPE_ORDER: EntryTypeFilter[] = ['power', 'ritual', 'ceremony']

const TYPE_LABEL: Record<EntryTypeFilter, string> = {
  power: 'Moc',
  ritual: 'Rytuał',
  ceremony: 'Ceremonia',
}

function sortWithin(a: MatchResult, b: MatchResult): number {
  const rank = (k: MatchResult['kind']) =>
    k === 'full' ? 0 : k === 'partial' ? 1 : 2
  const byKind = rank(a.kind) - rank(b.kind)
  if (byKind !== 0) return byKind
  const byLevel = a.power.level - b.power.level
  if (byLevel !== 0) return byLevel
  return a.power.name.localeCompare(b.power.name)
}

function groupByDiscipline(results: MatchResult[]): ResultSection[] {
  const map = new Map<string, MatchResult[]>()
  for (const result of results) {
    const key = result.power.discipline
    const list = map.get(key)
    if (list) list.push(result)
    else map.set(key, [result])
  }

  return [...map.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([discipline, items]) => {
      const sorted = [...items].sort(sortWithin)
      return {
        id: `disc:${discipline}`,
        title: discipline,
        count: sorted.length,
        results: sorted,
      }
    })
}

function groupByTypeLevel(results: MatchResult[]): ResultSection[] {
  const byType = new Map<EntryTypeFilter, Map<number, MatchResult[]>>()

  for (const result of results) {
    const type = entryTypeOf(result)
    let levels = byType.get(type)
    if (!levels) {
      levels = new Map()
      byType.set(type, levels)
    }
    const level = result.power.level
    const list = levels.get(level)
    if (list) list.push(result)
    else levels.set(level, [result])
  }

  return TYPE_ORDER.filter((type) => byType.has(type)).map((type) => {
    const levels = byType.get(type)!
    const subsections = [...levels.entries()]
      .sort(([a], [b]) => a - b)
      .map(([level, items]) => {
        const sorted = [...items].sort(sortWithin)
        return {
          id: `type:${type}:lvl:${level}`,
          title: `Poziom ${level}`,
          count: sorted.length,
          results: sorted,
        }
      })

    return {
      id: `type:${type}`,
      title: TYPE_LABEL[type],
      count: subsections.reduce((sum, s) => sum + s.count, 0),
      subsections,
    }
  })
}

function ungrouped(results: MatchResult[]): ResultSection[] {
  const sorted = [...results].sort(sortWithin)
  return [
    {
      id: 'all',
      title: '',
      count: sorted.length,
      results: sorted,
    },
  ]
}

export function groupResults(
  results: MatchResult[],
  mode: GroupByMode,
): ResultSection[] {
  if (mode === 'none') return ungrouped(results)
  if (mode === 'typeLevel') return groupByTypeLevel(results)
  return groupByDiscipline(results)
}

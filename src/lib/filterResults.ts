import type { MatchResult, PowerKind } from '../types'
import { bookLabel } from './formatSource'

export type EntryTypeFilter = PowerKind

export type ExtraFilters = {
  levels: number[]
  types: EntryTypeFilter[]
  nameQuery: string
  book: string
}

export function normalizeSearch(value: string): string {
  return value.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase()
}

export function entryTypeOf(result: MatchResult): EntryTypeFilter {
  const kind = result.power.kind
  if (kind === 'ritual' || kind === 'ceremony') return kind
  return 'power'
}

export function applyExtraFilters(
  results: MatchResult[],
  filters: ExtraFilters,
): MatchResult[] {
  const { levels, types, nameQuery, book } = filters
  const q = normalizeSearch(nameQuery.trim())
  const levelSet = levels.length > 0 ? new Set(levels) : null
  const typeSet = types.length > 0 ? new Set(types) : null

  return results.filter((result) => {
    if (levelSet && !levelSet.has(result.power.level)) return false
    if (typeSet && !typeSet.has(entryTypeOf(result))) return false
    if (q && !normalizeSearch(result.power.name).includes(q)) return false
    if (book && bookLabel(result.power.book) !== book) return false
    return true
  })
}

export function toggleInList<T>(list: T[], value: T): T[] {
  return list.includes(value)
    ? list.filter((item) => item !== value)
    : [...list, value]
}

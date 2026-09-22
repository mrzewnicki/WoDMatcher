import type { PowerEntry } from '../types'
import { parsePoolString } from './parseDisciplines'

const BOOK_NAME_TO_ID: Record<string, string> = {
  Corebook: 'Vampire,_The_Masquerade_V5_Corebook_Extended',
  'Players Guide': 'players-guide',
  "Player's Guide": 'players-guide',
  Camarilla: 'camarilla',
  'Cults of the Blood Gods': 'cults-of-the-blood-gods',
  'Cults of the Blood Gods — Hecata': 'cults-of-the-blood-gods',
  'Cults of the Blood Gods — Shalim': 'cults-of-the-blood-gods',
  'Sabbat: Black Hand': 'sabbat',
  'Sabbat: Czarna Ręka': 'sabbat',
}

type RitualIndexEntry = {
  name: string
  level: number
  type: string
  discipline: string
  sourcebook: string
  page_range?: string
}

type RitualDetail = {
  level?: number
  ingredients?: string
  process?: string
  system?: string
  prerequisite?: string
}

type RitualsPayload = {
  ritual_index?: RitualIndexEntry[]
  ritual_details?: Record<string, Record<string, RitualDetail>>
}

type CoreRitualPower = {
  name?: string
  ingredients?: string
  process?: string
  system?: string
}

type CoreDisciplines = {
  Rituals?: {
    book?: string
    levels?: Record<string, Record<string, CoreRitualPower>>
  }
}

const DEFAULT_POOLS: Record<string, string> = {
  'Blood Sorcery': 'Intelligence + Blood Sorcery',
  Oblivion: 'Resolve + Oblivion',
}

const ATTR =
  'Strength|Dexterity|Stamina|Charisma|Manipulation|Composure|Intelligence|Wits|Resolve'

/** Trait words stop before vs/or/and and similar prose connectors. */
const TRAIT = `[A-Za-z][A-Za-z'-]*(?:\\s+(?!vs\\b|or\\b|and\\b|test\\b|roll\\b|the\\b|against\\b|with\\b|for\\b|on\\b|to\\b|of\\b)[A-Za-z][A-Za-z'-]*){0,3}`

const SIDE = `(?:${ATTR})(?:\\s+or\\s+(?:${ATTR}))?\\s*\\+\\s*${TRAIT}`

const POOL_IN_TEXT = new RegExp(`\\b${SIDE}(?:\\s+vs\\s+${SIDE})?`, 'gi')

function slug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '')
}

function resolveBook(sourcebook: string): string {
  return BOOK_NAME_TO_ID[sourcebook] ?? sourcebook
}

function normalizeDiscipline(discipline: string, type: string): string {
  if (
    type === 'Oblivion Ceremony' ||
    discipline === 'Oblivion Ceremonies'
  ) {
    return 'Oblivion'
  }
  return discipline
}

function findDetail(
  name: string,
  sourcebook: string,
  details: Record<string, Record<string, RitualDetail>>,
): RitualDetail | undefined {
  const direct = details[sourcebook]?.[name]
  if (direct) return direct

  if (sourcebook.startsWith('Cults of the Blood Gods')) {
    return details['Cults of the Blood Gods']?.[name]
  }

  for (const map of Object.values(details)) {
    if (map[name]) return map[name]
  }
  return undefined
}

function buildCorebookLookup(
  disciplinesData: CoreDisciplines,
): Map<string, RitualDetail> {
  const map = new Map<string, RitualDetail>()
  const levels = disciplinesData.Rituals?.levels
  if (!levels) return map

  for (const levelPowers of Object.values(levels)) {
    for (const power of Object.values(levelPowers)) {
      if (!power.name) continue
      map.set(power.name, {
        ingredients: power.ingredients,
        process: power.process,
        system: power.system,
      })
    }
  }
  return map
}

function poolsForRitual(
  discipline: string,
  system?: string,
): { rawPools: string[]; terms: PowerEntry['terms'] } {
  const defaultPool = DEFAULT_POOLS[discipline]
  const rawPools: string[] = defaultPool ? [defaultPool] : []
  const terms = defaultPool ? [...parsePoolString(defaultPool)] : []

  if (system) {
    for (const match of system.matchAll(POOL_IN_TEXT)) {
      const cleaned = match[0].replace(/\s+/g, ' ').trim()
      const parsed = parsePoolString(cleaned)
      if (parsed.length === 0) continue
      if (!rawPools.includes(cleaned)) rawPools.push(cleaned)
      for (const term of parsed) {
        if (
          !terms.some(
            (t) => t.attribute === term.attribute && t.trait === term.trait,
          )
        ) {
          terms.push(term)
        }
      }
    }
  }

  return { rawPools, terms }
}

/** Flatten ritual_index (+ details / Corebook Rituals) into matcher entries. */
export function flattenRituals(
  data: RitualsPayload,
  disciplinesData?: CoreDisciplines,
): PowerEntry[] {
  const index = data.ritual_index ?? []
  const details = data.ritual_details ?? {}
  const corebook = disciplinesData
    ? buildCorebookLookup(disciplinesData)
    : new Map<string, RitualDetail>()

  const powers: PowerEntry[] = []

  for (const entry of index) {
    let detail = findDetail(entry.name, entry.sourcebook, details)
    if (!detail && entry.sourcebook === 'Corebook') {
      detail = corebook.get(entry.name)
    }

    const discipline = normalizeDiscipline(entry.discipline, entry.type)
    const { rawPools, terms } = poolsForRitual(discipline, detail?.system)
    if (terms.length === 0) continue

    const kind =
      entry.type === 'Oblivion Ceremony' ? 'ceremony' : 'ritual'

    powers.push({
      id: `${kind}:${discipline}:${entry.level}:${slug(entry.name)}:${slug(entry.sourcebook)}`,
      discipline,
      level: entry.level,
      name: entry.name,
      book: resolveBook(entry.sourcebook),
      page: entry.page_range,
      kind,
      system: detail?.system,
      ingredients: detail?.ingredients,
      process: detail?.process,
      prerequisite: detail?.prerequisite,
      rawPools,
      terms,
    })
  }

  return powers
}

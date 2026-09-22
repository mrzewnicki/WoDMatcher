import type { DiceTerm, PowerEntry } from '../types'

const SKIP_KEYS = new Set(['General Rules', 'Rituals', '_meta'])

const ATTRIBUTES = new Set([
  'Strength',
  'Dexterity',
  'Stamina',
  'Charisma',
  'Manipulation',
  'Composure',
  'Intelligence',
  'Wits',
  'Resolve',
])

/** Canonical V5 skills that can appear in discipline dice pools. */
const SKILLS = new Set([
  'Athletics',
  'Brawl',
  'Craft',
  'Drive',
  'Firearms',
  'Larceny',
  'Melee',
  'Stealth',
  'Survival',
  'Animal Ken',
  'Etiquette',
  'Insight',
  'Intimidation',
  'Leadership',
  'Performance',
  'Persuasion',
  'Streetwise',
  'Subterfuge',
  'Academics',
  'Awareness',
  'Finance',
  'Investigation',
  'Medicine',
  'Occult',
  'Politics',
  'Science',
  'Technology',
  'Alchemy',
])

const DISCIPLINES = new Set([
  'Animalism',
  'Auspex',
  'Blood Sorcery',
  'Celerity',
  'Dominate',
  'Fortitude',
  'Obfuscate',
  'Oblivion',
  'Potence',
  'Presence',
  'Protean',
  'Thin-Blood Alchemy',
])

/** Map sourcebook display names → V5_books.json ids. */
const BOOK_NAME_TO_ID: Record<string, string> = {
  Corebook: 'Vampire,_The_Masquerade_V5_Corebook_Extended',
  "Player's Guide": 'players-guide',
  'Cults of the Blood Gods': 'cults-of-the-blood-gods',
  'Sabbat: Czarna Ręka': 'sabbat',
  Sabbat: 'sabbat',
  Anarchiści: 'anarch',
  Anarch: 'anarch',
  'Chicago by Night': 'chicago-by-night',
}

export type TraitGroups = {
  skills: string[]
  disciplines: string[]
  other: string[]
}

function classifyTrait(trait: string): keyof TraitGroups {
  if (DISCIPLINES.has(trait)) return 'disciplines'
  if (SKILLS.has(trait)) return 'skills'
  if (ATTRIBUTES.has(trait)) return 'other'
  return 'other'
}

type RawSource = {
  book?: string
  page?: number
}

type RawPower = {
  name?: string
  cost?: string
  duration?: string
  amalgam?: string
  system?: string
  dice_pools?: string[]
  sources?: RawSource[]
}

type RawDiscipline = {
  book?: string
  levels?: Record<string, Record<string, RawPower>>
}

function normalizeToken(value: string): string {
  return value
    .replace(/\([^)]*\)/g, '')
    .replace(/\s+or as needed.*$/i, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function splitAlternatives(value: string): string[] {
  return value
    .split(/\s+(?:\/|or)\s+/i)
    .map((part) => normalizeToken(part))
    .filter(Boolean)
}

function pushTerm(terms: DiceTerm[], attribute: string, trait: string) {
  const attrAlts = splitAlternatives(attribute)
  const traitAlts = splitAlternatives(trait)

  for (const attr of attrAlts) {
    if (!ATTRIBUTES.has(attr)) continue
    for (const t of traitAlts) {
      // Skip non-trait fragments like "Stamina × 2" or difficulty prose.
      if (!t || /[×x]\s*\d/i.test(t) || /^difficulty\b/i.test(t)) continue
      terms.push({ attribute: attr, trait: t })
    }
  }
}

/** Split a contest side into pool chunks without breaking parentheticals or Attr or Attr + Trait. */
function splitSideChunks(side: string): string[] {
  // Protect commas inside parentheses so "Survival (Famulus, …)" stays one chunk.
  const protectedSide = side.replace(/\([^)]*\)/g, (m) => m.replace(/,/g, '\0'))
  const commaParts = protectedSide
    .split(',')
    .map((s) => s.replace(/\0/g, ',').trim())
    .filter(Boolean)

  const chunks: string[] = []
  for (const part of commaParts) {
    const orParts = part.split(/\s+or\s+/i)
    // "Stamina × 2 or Stamina + Fortitude" → split
    // "Composure or Stamina + Subterfuge" → keep (attribute alternatives)
    const allComplete = orParts.every((p) => /\+|×|\bx\s*\d/i.test(p))
    if (orParts.length > 1 && allComplete) {
      chunks.push(...orParts.map((p) => p.trim()).filter(Boolean))
    } else {
      chunks.push(part)
    }
  }
  return chunks
}

/** Split one pool string into Attribute + Trait pairs (attack side and resist side). */
export function parsePoolString(pool: string): DiceTerm[] {
  const terms: DiceTerm[] = []
  const sides = pool.split(/\s+vs\s+/i)

  for (const side of sides) {
    for (const chunk of splitSideChunks(side)) {
      const cleaned = normalizeToken(chunk)
      if (
        !cleaned ||
        /^or\b/i.test(cleaned) ||
        /^as well as\b/i.test(cleaned) ||
        /^n\/a$/i.test(cleaned) ||
        /^see\b/i.test(cleaned) ||
        /^as\b/i.test(cleaned)
      ) {
        continue
      }

      const plus = cleaned.match(/^(.+)\s*\+\s*(.+)$/)
      if (!plus) continue

      const left = normalizeToken(plus[1])
      const right = normalizeToken(plus[2])
      if (!left || !right) continue

      const leftHead = left.split(/\s+(?:\/|or)\s+/i)[0]
      const rightHead = right.split(/\s+(?:\/|or)\s+/i)[0]

      // Prefer Attribute on the left (standard V5 notation).
      if (ATTRIBUTES.has(leftHead)) {
        pushTerm(terms, left, right)
      } else if (ATTRIBUTES.has(rightHead)) {
        pushTerm(terms, right, left)
      } else {
        pushTerm(terms, left, right)
      }
    }
  }

  return terms
}

function resolveBook(power: RawPower, disciplineBook?: string): string | undefined {
  const fromSources = power.sources?.find((s) => s.book)?.book
  if (fromSources) {
    return BOOK_NAME_TO_ID[fromSources] ?? fromSources
  }
  return disciplineBook
}

export function flattenPowers(
  data: Record<string, RawDiscipline | unknown>,
): PowerEntry[] {
  const powers: PowerEntry[] = []

  for (const [discipline, body] of Object.entries(data)) {
    if (SKIP_KEYS.has(discipline) || !body || typeof body !== 'object') continue
    const disc = body as RawDiscipline
    if (!disc.levels) continue

    for (const [levelKey, levelPowers] of Object.entries(disc.levels)) {
      const level = Number(levelKey)
      for (const [powerKey, power] of Object.entries(levelPowers)) {
        const rawPools = power.dice_pools ?? []
        if (rawPools.length === 0) continue

        const terms = rawPools.flatMap(parsePoolString)
        if (terms.length === 0) continue

        powers.push({
          id: `${discipline}:${level}:${powerKey}`,
          discipline,
          level,
          name: power.name ?? powerKey,
          book: resolveBook(power, disc.book),
          cost: power.cost,
          duration: power.duration,
          amalgam: power.amalgam,
          system: power.system,
          rawPools,
          terms,
        })
      }
    }
  }

  return powers
}

export function collectTraitOptions(powers: PowerEntry[]): {
  attributes: string[]
  traits: TraitGroups
} {
  const attributes = new Set<string>()
  const skills = new Set<string>()
  const disciplines = new Set<string>()
  const other = new Set<string>()

  for (const power of powers) {
    for (const term of power.terms) {
      if (ATTRIBUTES.has(term.attribute)) attributes.add(term.attribute)

      const group = classifyTrait(term.trait)
      if (group === 'skills') skills.add(term.trait)
      else if (group === 'disciplines') disciplines.add(term.trait)
      else other.add(term.trait)
    }
  }

  const byName = (a: string, b: string) => a.localeCompare(b)

  return {
    attributes: [...attributes].sort(byName),
    traits: {
      skills: [...skills].sort(byName),
      disciplines: [...disciplines].sort(byName),
      other: [...other].sort(byName),
    },
  }
}

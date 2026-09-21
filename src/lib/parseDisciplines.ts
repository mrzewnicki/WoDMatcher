import type { DiceTerm, PowerEntry } from '../types'

const SKIP_KEYS = new Set(['General Rules', 'Rituals'])

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

type RawPower = {
  name?: string
  cost?: string
  duration?: string
  amalgam?: string
  system?: string
  dice_pools?: string[]
}

type RawDiscipline = {
  levels?: Record<string, Record<string, RawPower>>
}

function normalizeToken(value: string): string {
  return value
    .replace(/\(.*?\)/g, '')
    .replace(/\s+or as needed.*$/i, '')
    .replace(/\s+/g, ' ')
    .trim()
}

/** Split one pool string into Attribute + Trait pairs (attack side and resist side). */
export function parsePoolString(pool: string): DiceTerm[] {
  const terms: DiceTerm[] = []
  const sides = pool.split(/\s+vs\s+/i)

  for (const side of sides) {
    const chunks = side
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)

    for (const chunk of chunks) {
      const cleaned = normalizeToken(chunk)
      if (!cleaned || /^or\b/i.test(cleaned) || /^as well as\b/i.test(cleaned)) {
        continue
      }

      const plus = cleaned.match(/^(.+?)\s*\+\s*(.+)$/)
      if (!plus) continue

      const left = normalizeToken(plus[1])
      const right = normalizeToken(plus[2])
      if (!left || !right) continue

      // Prefer Attribute on the left (standard V5 notation).
      if (ATTRIBUTES.has(left)) {
        terms.push({ attribute: left, trait: right })
      } else if (ATTRIBUTES.has(right)) {
        terms.push({ attribute: right, trait: left })
      } else {
        // Fallback: treat first token as attribute-like.
        terms.push({ attribute: left, trait: right })
      }
    }
  }

  return terms
}

export function flattenPowers(
  data: Record<string, RawDiscipline>,
): PowerEntry[] {
  const powers: PowerEntry[] = []

  for (const [discipline, body] of Object.entries(data)) {
    if (SKIP_KEYS.has(discipline) || !body?.levels) continue

    for (const [levelKey, levelPowers] of Object.entries(body.levels)) {
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
  traits: string[]
} {
  const attributes = new Set<string>()
  const traits = new Set<string>()

  for (const power of powers) {
    for (const term of power.terms) {
      if (ATTRIBUTES.has(term.attribute)) attributes.add(term.attribute)
      traits.add(term.trait)
    }
  }

  return {
    attributes: [...attributes].sort((a, b) => a.localeCompare(b)),
    traits: [...traits].sort((a, b) => a.localeCompare(b)),
  }
}

import type { MatchKind, MatchResult, PowerEntry } from '../types'

function same(a: string, b: string): boolean {
  return a.localeCompare(b, undefined, { sensitivity: 'accent' }) === 0
}

/**
 * Full match: a power term has both selected attribute and trait.
 * Partial match: exactly one of the two matches on some term (and not a full match).
 */
export function matchPowers(
  powers: PowerEntry[],
  attribute: string | null,
  trait: string | null,
): MatchResult[] {
  if (!attribute && !trait) return []

  const results: MatchResult[] = []

  for (const power of powers) {
    let kind: MatchKind | null = null
    let matchedTerms = power.terms.filter((term) => {
      const attrOk = attribute ? same(term.attribute, attribute) : false
      const traitOk = trait ? same(term.trait, trait) : false

      if (attribute && trait) {
        if (attrOk && traitOk) {
          kind = 'full'
          return true
        }
        if (attrOk || traitOk) {
          if (kind !== 'full') kind = 'partial'
          return true
        }
        return false
      }

      // Single argument selected → any hit is a full match for that criterion.
      if (attrOk || traitOk) {
        kind = 'full'
        return true
      }
      return false
    })

    // Prefer reporting full if any term was full; keep only best-tier terms for clarity.
    if (kind === 'full' && attribute && trait) {
      const fullOnly = power.terms.filter(
        (term) =>
          same(term.attribute, attribute) && same(term.trait, trait),
      )
      if (fullOnly.length > 0) {
        matchedTerms = fullOnly
        kind = 'full'
      }
    }

    if (!kind || matchedTerms.length === 0) continue

    results.push({
      power,
      kind,
      matchedTerms,
      matchedPool: power.rawPools.join('; '),
    })
  }

  const rank = (k: MatchKind) => (k === 'full' ? 0 : 1)
  return results.sort((a, b) => {
    const byKind = rank(a.kind) - rank(b.kind)
    if (byKind !== 0) return byKind
    const byDisc = a.power.discipline.localeCompare(b.power.discipline)
    if (byDisc !== 0) return byDisc
    return a.power.level - b.power.level || a.power.name.localeCompare(b.power.name)
  })
}

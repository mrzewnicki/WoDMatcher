import type { MatchKind, MatchResult, PowerEntry } from '../types'

function same(a: string, b: string): boolean {
  return a.localeCompare(b, undefined, { sensitivity: 'accent' }) === 0
}

/**
 * Full match: both arguments are selected and a power term contains both.
 * Partial match: exactly one of the two arguments matches (or only one was selected).
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
    const matchedTerms = power.terms.filter((term) => {
      const attrOk = Boolean(attribute && same(term.attribute, attribute))
      const traitOk = Boolean(trait && same(term.trait, trait))

      if (attrOk && traitOk) {
        kind = 'full'
        return true
      }

      if (attrOk || traitOk) {
        if (kind !== 'full') kind = 'partial'
        return true
      }

      return false
    })

    // If any term is a full pair match, surface those terms for the card.
    if (kind === 'full' && attribute && trait) {
      const fullOnly = power.terms.filter(
        (term) =>
          same(term.attribute, attribute) && same(term.trait, trait),
      )
      results.push({
        power,
        kind: 'full',
        matchedTerms: fullOnly.length > 0 ? fullOnly : matchedTerms,
        matchedPool: power.rawPools.join('; '),
      })
      continue
    }

    if (kind !== 'partial' || matchedTerms.length === 0) continue

    results.push({
      power,
      kind: 'partial',
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

export type MatchKind = 'full' | 'partial'

export type DiceTerm = {
  attribute: string
  trait: string
}

export type PowerEntry = {
  id: string
  discipline: string
  level: number
  name: string
  cost?: string
  duration?: string
  amalgam?: string
  system?: string
  rawPools: string[]
  terms: DiceTerm[]
}

export type MatchResult = {
  power: PowerEntry
  kind: MatchKind
  matchedTerms: DiceTerm[]
  matchedPool: string
}

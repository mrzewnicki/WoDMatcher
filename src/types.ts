export type MatchKind = 'full' | 'partial' | 'all'

export type DiceTerm = {
  attribute: string
  trait: string
}

export type BookId = string

export type Book = {
  name: string
  short_name: string
  year?: number
  /** Local PDF path for internal use only — never render in UI. */
  file_path?: string
}

export type PowerKind = 'power' | 'ritual' | 'ceremony'

export type PowerEntry = {
  id: string
  discipline: string
  level: number
  name: string
  book?: BookId
  /** Printed page number, or a range string (e.g. rituals "274-281"). */
  page?: number | string
  kind?: PowerKind
  cost?: string
  duration?: string
  amalgam?: string
  system?: string
  ingredients?: string
  process?: string
  prerequisite?: string
  rawPools: string[]
  terms: DiceTerm[]
}

export type MatchResult = {
  power: PowerEntry
  kind: MatchKind
  matchedTerms: DiceTerm[]
  matchedPool: string
}

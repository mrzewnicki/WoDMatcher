export type MatchKind = 'full' | 'partial'

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

export type PowerEntry = {
  id: string
  discipline: string
  level: number
  name: string
  book?: BookId
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
